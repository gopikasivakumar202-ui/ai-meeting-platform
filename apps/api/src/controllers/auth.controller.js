const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// In-memory user store (replace with PostgreSQL later)
const users = [];

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

// Register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" });

    // Check if user exists
    const existingUser = users.find((u) => u.email === email);
    if (existingUser)
      return res.status(409).json({ error: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    };
    users.push(user);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      message: "Registration successful",
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // Find user
    const user = users.find((u) => u.email === email);
    if (!user)
      return res.status(401).json({ error: "Invalid credentials" });

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ error: "Invalid credentials" });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get current user
const getMe = (req, res) => {
  res.json({ user: req.user });
};

// Refresh token
const refresh = (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(401).json({ error: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = users.find((u) => u.id === decoded.id);
    if (!user)
      return res.status(401).json({ error: "Invalid refresh token" });

    const tokens = generateTokens(user);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

module.exports = { register, login, getMe, refresh };