from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

def run_query(query, params=()):
    conn = sqlite3.connect("closet.db")
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    conn.close()

@app.route("/add_clothes", methods=["POST"])
def add_clothes():
    data = request.json
    run_query("INSERT INTO clothes (name, color) VALUES (?, ?)", 
              (data["name"], data["color"]))
    return jsonify({"status": "success"})
@app.route("/get_clothes", methods=["GET"])
def get_clothes():
    conn = sqlite3.connect("closet.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM clothes")
    clothes = cursor.fetchall()
    conn.close()
    return jsonify(clothes)