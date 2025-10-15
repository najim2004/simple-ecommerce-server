import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { JwtPayload } from './auth.service';
import { Request } from 'express';
type JwtExtractor = (req: Request) => string | null;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // const cookieExtractor = (req: Request) =>
    //   (req?.cookies?.jwt ?? null) as string;
    const bearerExtractor: JwtExtractor =
      ExtractJwt.fromAuthHeaderAsBearerToken() as JwtExtractor;
    super({
      jwtFromRequest: (req: Request) =>
        // cookieExtractor(req) ||
        bearerExtractor(req),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
