import {
  AuthenticationStrategy,
  ExternalAuthenticationService,
  Injector,
  Logger,
  RequestContext,
  User,
} from '@vendure/core'
import { OAuth2Client } from 'google-auth-library'
import { DocumentNode } from 'graphql'
import { gql } from 'graphql-tag'
import { loggerCtx } from './constants'
import { PluginInitOptions } from './types'

export type GoogleAuthData = {
  token: string
}

export class GoogleAuthStrategy implements AuthenticationStrategy<GoogleAuthData> {
  readonly name = 'google'
  private client: OAuth2Client
  private externalAuthenticationService: ExternalAuthenticationService
  private logger: Logger
  private injector: Injector
  constructor(private options: PluginInitOptions) {
    this.client = new OAuth2Client(options.googleClientId)
    this.logger = new Logger()
  }

  init(injector: Injector) {
    this.externalAuthenticationService = injector.get(ExternalAuthenticationService)
    this.injector = injector
  }

  defineInputType(): DocumentNode {
    return gql`
      input GoogleAuthInput {
        token: String!
      }
    `
  }

  async authenticate(ctx: RequestContext, data: GoogleAuthData): Promise<User | false> {
    const ticket = await this.client.verifyIdToken({
      idToken: data.token,
      audience: this.options.googleClientId,
    })

    const payload = ticket.getPayload()

    if (!payload || !payload.email) {
      this.logger.error('Invalid Google token', loggerCtx)
      return false
    }

    const user = await this.externalAuthenticationService.findCustomerUser(
      ctx,
      this.name,
      payload.sub,
    )

    if (user) {
      this.logger.verbose(`User found ${user.identifier}`, loggerCtx)
      this.options.onUserFound?.(ctx, this.injector, user)
      return user
    }

    const createdUser = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
      strategy: this.name,
      externalIdentifier: payload.sub,
      verified: payload.email_verified || false,
      emailAddress: payload.email,
      firstName: payload.given_name || 'Google',
      lastName: payload.family_name || 'User',
    })

    this.options.onUserCreated?.(ctx, this.injector, createdUser)

    return createdUser
  }
}
