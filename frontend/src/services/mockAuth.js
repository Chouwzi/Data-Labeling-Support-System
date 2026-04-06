const mockUsers = [
  { email: "admin@test.com", password: "123456", role: "ADMIN" },
  { email: "manager@test.com", password: "123456", role: "MANAGER" },
  { email: "annotator@test.com", password: "123456", role: "ANNOTATOR" },
  { email: "reviewer@test.com", password: "123456", role: "REVIEWER" }
];

export const mockLogin = async (email, password) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  return {
    accessToken: "mock-jwt-token-" + user.role,
    role: user.role,
  };
};
