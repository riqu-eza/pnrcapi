import jwt from "jsonwebtoken";

const ACCESS_TOKEN_TTL = "15m";

const JWT_SECRET = process.env.JWT_SECRET!;

export type JwtPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
