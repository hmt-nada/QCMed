import sqlite3
import pandas as pd
from sqlalchemy import create_engine

# --- CONFIGURATION ---
sqlite_file = r"C:\Users\LENOVO\Desktop\QCM-med\BACKEND\qcm.db"

# Neon PostgreSQL
postgres_url = "postgresql+psycopg2://neondb_owner:npg_mIMHY5Bg0Xxj@ep-nameless-fog-adq89kgb-pooler.c-2.us-east-1.aws.neon.tech:5432/neondb?sslmode=require"

# --- CONNEXIONS ---
sqlite_conn = sqlite3.connect(sqlite_file)
engine_pg = create_engine(postgres_url)

# --- Récupérer toutes les tables SQLite ---
tables = sqlite_conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
tables = [t[0] for t in tables]

# --- Copier chaque table vers PostgreSQL ---
for table in tables:
    print(f"Migrating table: {table} ...")
    df = pd.read_sql_query(f"SELECT * FROM {table}", sqlite_conn)
    df.to_sql(table, engine_pg, if_exists='replace', index=False)
    print(f"Table {table} migrated successfully!")

# --- FIN ---
sqlite_conn.close()
print("Migration finished successfully!")
