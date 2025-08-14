import { Injector, RequestContext, User } from '@vendure/core'

/**
 * @description
 * The plugin can be configured using the following options:
 */
export interface PluginInitOptions {
  clientId?: string
  clientSecret?: string
  onUserCreated?: (ctx: RequestContext, injector: Injector, user: User) => void
  onUserFound?: (ctx: RequestContext, injector: Injector, user: User) => void
}
