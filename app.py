"""
TCOIN Backend — Flask API
Run: python app.py
Deploy: Render (gunicorn app:app)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3, hashlib, secrets, string, datetime, os

app = Flask(__name__)
CORS(app)

DB = "tcoin.db"

# ─── DB SETUP ────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as db:
        db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            balance INTEGER DEFAULT 0,
            total_earned INTEGER DEFAULT 0,
            today_earned INTEGER DEFAULT 0,
            ref_code TEXT UNIQUE,
            referred_by TEXT,
            ref_earn INTEGER DEFAULT 0,
            role TEXT DEFAULT 'user',
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            reward INTEGER NOT NULL,
            timer INTEGER DEFAULT 0,
            active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS completions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            task_id INTEGER,
            earned INTEGER,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, task_id)
        );

        CREATE TABLE IF NOT EXISTS campaigns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            type TEXT,
            target INTEGER,
            completed INTEGER DEFAULT 0,
            reward INTEGER,
            budget REAL,
            url TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS withdrawals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            amount INTEGER,
            method TEXT,
            account TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """)
        # Seed admin user
        pw = hashlib.sha256("admin123".encode()).hexdigest()
        db.execute("""
            INSERT OR IGNORE INTO users (name, email, password, role, ref_code)
            VALUES ('Admin', 'admin@tcoin.app', ?, 'admin', 'ADMIN00001')
        """, (pw,))
        # Seed sample tasks
        sample = [
            ("video","Watch Crypto Tutorial","https://youtube.com/watch?v=abc",25,15),
            ("video","DeFi Explained","https://youtube.com/watch?v=def",30,20),
            ("web","Visit CryptoNews","https://coindesk.com",10,10),
            ("apps","Download WalletApp","https://play.google.com/store",50,0),
            ("ads","View Sponsored Ad","https://ad.example.com",5,8),
        ]
        for s in sample:
            db.execute("""INSERT OR IGNORE INTO tasks (type,title,url,reward,timer) VALUES (?,?,?,?,?)""", s)

# ─── HELPERS ─────────────────────────────────────────────────
def hash_pw(pw): return hashlib.sha256(pw.encode()).hexdigest()
def gen_ref(): return "TCOIN" + "".join(secrets.choice(string.digits) for _ in range(8))
def auth(req):
    """Simple token auth — in prod use JWT"""
    token = req.headers.get("X-User-Id")
    if not token: return None
    db = get_db()
    return db.execute("SELECT * FROM users WHERE id=? AND status='active'", (token,)).fetchone()

def row_to_dict(row): return dict(row) if row else None
def rows_to_list(rows): return [dict(r) for r in rows]

# ─── AUTH ROUTES ─────────────────────────────────────────────
@app.route("/register", methods=["POST"])
def register():
    d = request.json
    if not d or not all(k in d for k in ["name","email","password"]):
        return jsonify({"error": "Missing fields"}), 400
    ref_code = gen_ref()
    pw = hash_pw(d["password"])
    ref_bonus = 0
    try:
        with get_db() as db:
            cur = db.execute(
                "INSERT INTO users (name,email,password,ref_code,referred_by,balance) VALUES (?,?,?,?,?,?)",
                (d["name"], d["email"], pw, ref_code, d.get("ref_code",""), 20 if d.get("ref_code") else 0)
            )
            uid = cur.lastrowid
            # Reward referrer
            if d.get("ref_code"):
                db.execute("""
                    UPDATE users SET balance=balance+20, ref_earn=ref_earn+20, total_earned=total_earned+20
                    WHERE ref_code=?
                """, (d["ref_code"],))
        user = row_to_dict(get_db().execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone())
        user.pop("password", None)
        return jsonify({"user": user, "token": str(uid)}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 409

@app.route("/login", methods=["POST"])
def login():
    d = request.json
    if not d or not all(k in d for k in ["email","password"]):
        return jsonify({"error": "Missing fields"}), 400
    pw = hash_pw(d["password"])
    user = row_to_dict(get_db().execute(
        "SELECT * FROM users WHERE email=? AND password=?", (d["email"], pw)
    ).fetchone())
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    if user["status"] == "banned":
        return jsonify({"error": "Account banned"}), 403
    user.pop("password", None)
    return jsonify({"user": user, "token": str(user["id"])}), 200

# ─── TASK ROUTES ─────────────────────────────────────────────
@app.route("/tasks", methods=["GET"])
def get_tasks():
    task_type = request.args.get("type")
    db = get_db()
    user = auth(request)
    if task_type:
        tasks = rows_to_list(db.execute("SELECT * FROM tasks WHERE type=? AND active=1", (task_type,)).fetchall())
    else:
        tasks = rows_to_list(db.execute("SELECT * FROM tasks WHERE active=1").fetchall())
    if user:
        done_ids = {r["task_id"] for r in db.execute(
            "SELECT task_id FROM completions WHERE user_id=?", (user["id"],)
        ).fetchall()}
        for t in tasks:
            t["completed"] = t["id"] in done_ids
    return jsonify({"tasks": tasks})

@app.route("/complete_task", methods=["POST"])
def complete_task():
    user = auth(request)
    if not user: return jsonify({"error": "Unauthorized"}), 401
    d = request.json
    task_id = d.get("task_id")
    db = get_db()
    task = row_to_dict(db.execute("SELECT * FROM tasks WHERE id=? AND active=1", (task_id,)).fetchone())
    if not task: return jsonify({"error": "Task not found"}), 404
    try:
        with get_db() as db:
            db.execute("INSERT INTO completions (user_id,task_id,earned) VALUES (?,?,?)",
                       (user["id"], task_id, task["reward"]))
            db.execute("""
                UPDATE users SET balance=balance+?, total_earned=total_earned+?, today_earned=today_earned+?
                WHERE id=?
            """, (task["reward"], task["reward"], task["reward"], user["id"]))
        return jsonify({"reward": task["reward"], "message": f"+{task['reward']} TCOIN earned!"})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Task already completed"}), 409

# ─── CAMPAIGN ROUTES ──────────────────────────────────────────
@app.route("/campaigns", methods=["GET"])
def get_campaigns():
    status = request.args.get("status", "active")
    camps = rows_to_list(get_db().execute(
        "SELECT * FROM campaigns WHERE status=?", (status,)
    ).fetchall())
    return jsonify({"campaigns": camps})

@app.route("/campaign", methods=["POST"])
def create_campaign():
    user = auth(request)
    if not user: return jsonify({"error": "Unauthorized"}), 401
    d = request.json
    required = ["title","type","target","reward","budget","url"]
    if not all(k in d for k in required): return jsonify({"error": "Missing fields"}), 400
    with get_db() as db:
        cur = db.execute("""
            INSERT INTO campaigns (user_id,title,type,target,reward,budget,url)
            VALUES (?,?,?,?,?,?,?)
        """, (user["id"], d["title"], d["type"], d["target"], d["reward"], d["budget"], d["url"]))
    return jsonify({"campaign_id": cur.lastrowid, "status": "pending"}), 201

@app.route("/campaign/<int:cid>", methods=["PATCH"])
def update_campaign(cid):
    user = auth(request)
    if not user or user["role"] != "admin": return jsonify({"error": "Forbidden"}), 403
    d = request.json
    with get_db() as db:
        db.execute("UPDATE campaigns SET status=? WHERE id=?", (d["status"], cid))
    return jsonify({"success": True})

# ─── PROFILE ─────────────────────────────────────────────────
@app.route("/profile", methods=["GET"])
def profile():
    user = auth(request)
    if not user: return jsonify({"error": "Unauthorized"}), 401
    u = row_to_dict(get_db().execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone())
    u.pop("password", None)
    return jsonify({"user": u})

# ─── REFERRAL ────────────────────────────────────────────────
@app.route("/referral", methods=["GET"])
def referral():
    user = auth(request)
    if not user: return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    referrals = rows_to_list(db.execute(
        "SELECT id,name,email,created_at FROM users WHERE referred_by=?",
        (user["ref_code"],)
    ).fetchall())
    return jsonify({"ref_code": user["ref_code"], "ref_earn": user["ref_earn"], "referrals": referrals})

# ─── WITHDRAW ────────────────────────────────────────────────
@app.route("/withdraw", methods=["POST"])
def withdraw():
    user = auth(request)
    if not user: return jsonify({"error": "Unauthorized"}), 401
    d = request.json
    if not all(k in d for k in ["amount","method","account"]):
        return jsonify({"error": "Missing fields"}), 400
    if d["amount"] < 100:
        return jsonify({"error": "Minimum withdrawal is 100 TCOIN"}), 400
    if user["balance"] < d["amount"]:
        return jsonify({"error": "Insufficient balance"}), 400
    with get_db() as db:
        db.execute("INSERT INTO withdrawals (user_id,amount,method,account) VALUES (?,?,?,?)",
                   (user["id"], d["amount"], d["method"], d["account"]))
        db.execute("UPDATE users SET balance=balance-? WHERE id=?", (d["amount"], user["id"]))
    return jsonify({"success": True, "message": "Withdrawal request submitted"}), 201

# ─── ADMIN ROUTES ─────────────────────────────────────────────
@app.route("/admin/users", methods=["GET"])
def admin_users():
    user = auth(request)
    if not user or user["role"] != "admin": return jsonify({"error": "Forbidden"}), 403
    users = rows_to_list(get_db().execute("SELECT * FROM users").fetchall())
    for u in users: u.pop("password", None)
    return jsonify({"users": users})

@app.route("/admin/user/<int:uid>", methods=["PATCH"])
def admin_update_user(uid):
    user = auth(request)
    if not user or user["role"] != "admin": return jsonify({"error": "Forbidden"}), 403
    d = request.json
    with get_db() as db:
        if "status" in d:
            db.execute("UPDATE users SET status=? WHERE id=?", (d["status"], uid))
        if "balance" in d:
            db.execute("UPDATE users SET balance=? WHERE id=?", (d["balance"], uid))
    return jsonify({"success": True})

@app.route("/admin/tasks", methods=["POST"])
def admin_add_task():
    user = auth(request)
    if not user or user["role"] != "admin": return jsonify({"error": "Forbidden"}), 403
    d = request.json
    with get_db() as db:
        cur = db.execute(
            "INSERT INTO tasks (type,title,url,reward,timer) VALUES (?,?,?,?,?)",
            (d["type"], d["title"], d["url"], d["reward"], d.get("timer", 0))
        )
    return jsonify({"task_id": cur.lastrowid}), 201

@app.route("/admin/tasks/<int:tid>", methods=["DELETE"])
def admin_delete_task(tid):
    user = auth(request)
    if not user or user["role"] != "admin": return jsonify({"error": "Forbidden"}), 403
    with get_db() as db:
        db.execute("UPDATE tasks SET active=0 WHERE id=?", (tid,))
    return jsonify({"success": True})

@app.route("/admin/withdrawals", methods=["GET"])
def admin_withdrawals():
    user = auth(request)
    if not user or user["role"] != "admin": return jsonify({"error": "Forbidden"}), 403
    ws = rows_to_list(get_db().execute("SELECT * FROM withdrawals ORDER BY created_at DESC").fetchall())
    return jsonify({"withdrawals": ws})

@app.route("/admin/withdrawal/<int:wid>", methods=["PATCH"])
def admin_update_withdrawal(wid):
    user = auth(request)
    if not user or user["role"] != "admin": return jsonify({"error": "Forbidden"}), 403
    d = request.json
    with get_db() as db:
        w = row_to_dict(db.execute("SELECT * FROM withdrawals WHERE id=?", (wid,)).fetchone())
        db.execute("UPDATE withdrawals SET status=? WHERE id=?", (d["status"], wid))
        # Refund if rejected
        if d["status"] == "rejected":
            db.execute("UPDATE users SET balance=balance+? WHERE id=?", (w["amount"], w["user_id"]))
    return jsonify({"success": True})

@app.route("/admin/stats", methods=["GET"])
def admin_stats():
    user = auth(request)
    if not user or user["role"] != "admin": return jsonify({"error": "Forbidden"}), 403
    db = get_db()
    stats = {
        "total_users": db.execute("SELECT COUNT(*) FROM users WHERE role='user'").fetchone()[0],
        "active_campaigns": db.execute("SELECT COUNT(*) FROM campaigns WHERE status='active'").fetchone()[0],
        "pending_withdrawals": db.execute("SELECT COUNT(*) FROM withdrawals WHERE status='pending'").fetchone()[0],
        "total_tasks": db.execute("SELECT COUNT(*) FROM tasks WHERE active=1").fetchone()[0],
        "total_completions": db.execute("SELECT COUNT(*) FROM completions").fetchone()[0],
    }
    return jsonify(stats)

# ─── HEALTH CHECK ────────────────────────────────────────────
@app.route("/health")
def health(): return jsonify({"status": "ok", "app": "TCOIN API"})

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
