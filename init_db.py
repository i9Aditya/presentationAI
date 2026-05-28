import psycopg2
import os

# New password provided: Aditya_PPTAi
try:
    print("⏳ Connecting to Supabase with new password...")
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="Aditya_PPTAi",
        host="db.sirydakfxeyogacuzfkw.supabase.co",
        port="5432"
    )
    cur = conn.cursor()
    
    # Read the schema file
    schema_path = os.path.join("infra", "db", "schema.sql")
    print(f"📖 Reading schema from {schema_path}...")
    
    with open(schema_path, "r") as f:
        sql = f.read()
    
    print("🚀 Executing schema...")
    cur.execute(sql)
    conn.commit()
    
    cur.close()
    conn.close()
    print("✅ Database initialized successfully!")
    
except Exception as e:
    print(f"❌ Error: {e}")
