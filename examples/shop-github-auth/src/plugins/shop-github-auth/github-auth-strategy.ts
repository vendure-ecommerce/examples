import {
  AuthenticationStrategy,
  ExternalAuthenticationService,
  Injector,
  Logger,
  RequestContext,
  User,
} from '@vendure/core'
import { DocumentNode } from 'graphql'
import { gql } from 'graphql-tag'
import { loggerCtx } from './constants'
import { PluginInitOptions } from './types'

export type GitHubAuthData = {
  code: string
}

export class GithubAuthStrategy implements AuthenticationStrategy<GitHubAuthData> {
  readonly name = 'github'
  private externalAuthenticationService: ExternalAuthenticationService
  private logger: Logger
  private injector: Injector
  constructor(private options: PluginInitOptions) {
    this.logger = new Logger()
  }

  init(injector: Injector) {
    this.externalAuthenticationService = injector.get(ExternalAuthenticationService)
    this.injector = injector
  }

  defineInputType(): DocumentNode {
    return gql`
      input GitHubAuthInput {
        code: String!
      }
    `
  }

  async authenticate(ctx: RequestContext, data: GitHubAuthData): Promise<User | false> {
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: this.options.clientId,
        client_secret: this.options.clientSecret,
        code: data.code,
      }),
    })
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      this.logger.error('No access token received from GitHub', loggerCtx)
      return false
    }

    // Retrieve user information from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const userData = await userResponse.json()
    if (!userData || !userData.id) {
      this.logger.error('No user data received from GitHub', loggerCtx)
      return false
    }

    // Find or create the user in Vendure's database
    const user = await this.externalAuthenticationService.findCustomerUser(
      ctx,
      this.name,
      userData.login,
    )
    if (user) {
      this.logger.verbose(`User found in Vendure ${user.identifier}`, loggerCtx)
      this.options.onUserFound?.(ctx, this.injector, user)
      return user
    }

    const splitName = userData.name.trim().split(' ')
    const lastName = splitName.at(splitName.length - 1) || ''
    const firstName = splitName.at(0) || ''

    const createdUser = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
      strategy: this.name,
      externalIdentifier: userData.login,
      emailAddress: `${userData.login}-github@vendure.io`,
      verified: true,
      firstName,
      lastName,
    })

    this.options.onUserCreated?.(ctx, this.injector, createdUser)

    return createdUser
  }
}
