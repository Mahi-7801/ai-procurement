import bcrypt

password = "a" * 72
password_bytes = password.encode('utf-8')
print(f"Bcrypt version: {bcrypt.__version__}")
salt = bcrypt.gensalt()
try:
    print(f"Testing password ({len(password_bytes)} bytes)")
    hashed = bcrypt.hashpw(password_bytes, salt)
    print("Success with 72 bytes!")
except Exception as e:
    print(f"Failed with 72 bytes: {e}")

password_long = "a" * 73
password_long_bytes = password_long.encode('utf-8')
try:
    print(f"Testing password ({len(password_long_bytes)} bytes)")
    hashed_long = bcrypt.hashpw(password_long_bytes, salt)
    print("Success with 73 bytes!")
except Exception as e:
    print(f"Failed with 73 bytes: {e}")
