import bcrypt

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

# Test it
password = "my_secure_password"
hashed = get_password_hash(password)
print(f"Hashed: {hashed}")

is_match = verify_password(password, hashed)
print(f"Match: {is_match}")

is_not_match = verify_password("wrong_password", hashed)
print(f"Wrong Password Match: {is_not_match}")

# Test with exactly 72 bytes
password_72 = "a" * 72
hashed_72 = get_password_hash(password_72)
print(f"72 Chars Match: {verify_password(password_72, hashed_72)}")

# Test with 80 bytes (should truncate to 72 and match)
password_80 = "a" * 80
hashed_80 = get_password_hash(password_80)
print(f"80 Chars Match (with truncation): {verify_password(password_80[:72], hashed_80)}")
print(f"80 Chars Match (whole string): {verify_password(password_80, hashed_80)}")
