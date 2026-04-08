import bcrypt

password = "demo".encode('utf-8')
print(f"Bcrypt version: {bcrypt.__version__}")
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password, salt)
print(f"Hashed: {hashed}")

password_long = ("a" * 80).encode('utf-8')
try:
    print(f"Testing long password ({len(password_long)} bytes)")
    hashed_long = bcrypt.hashpw(password_long, salt)
    print("Success with direct bcrypt (it probably truncates internally or works if < limit)")
except Exception as e:
    print(f"Failed with direct bcrypt: {e}")
