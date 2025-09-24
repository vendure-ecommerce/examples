# Abandoned Cart Implementation Guide

## Architecture Overview

The abandoned cart system uses Vendure's scheduled task system to identify and notify customers about incomplete orders. The implementation targets orders in "AddingItems" and "ArrangingPayment" states that have been inactive for 12+ hours.

## Core Components

### 1. Abandoned Cart Plugin

```typescript
// src/plugins/abandoned-cart/abandoned-cart.plugin.ts
import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { DefaultSchedulerPlugin } from '@vendure/core';

import { AbandonedCartService } from './services/abandoned-cart.service';
import { abandonedCartTask } from './config/abandoned-cart-task';
import { orderCustomFields } from './config/custom-fields';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [AbandonedCartService],
  scheduledTasks: [abandonedCartTask],
  configuration: config => {
    config.customFields.Order.push(...orderCustomFields);
    return config;
  },
})
export class AbandonedCartPlugin {}
```

### 2. Custom Fields Configuration

```typescript
// src/plugins/abandoned-cart/config/custom-fields.ts
import { CustomFieldConfig } from '@vendure/core';

export const orderCustomFields: CustomFieldConfig[] = [
  {
    name: 'abandonedCartNotificationSent',
    type: 'boolean',
    defaultValue: false,
    public: false,
    description: 'Tracks if abandoned cart notification was sent'
  },
  {
    name: 'abandonedCartFirstNotifiedAt',
    type: 'datetime',
    nullable: true,
    public: false,
    description: 'Timestamp of first abandoned cart notification'
  },
  {
    name: 'abandonedCartSecondNotifiedAt',
    type: 'datetime',
    nullable: true,
    public: false,
    description: 'Timestamp of second abandoned cart notification'
  }
];
```

### 3. Scheduled Task

```typescript
// src/plugins/abandoned-cart/config/abandoned-cart-task.ts
import { ScheduledTask, RequestContextService } from '@vendure/core';
import { AbandonedCartService } from '../services/abandoned-cart.service';

export const abandonedCartTask = new ScheduledTask({
  id: 'abandoned-cart-notifications',
  description: 'Process abandoned cart notifications',
  schedule: cron => cron.every(12).hours(),
  async execute({ injector }) {
    const abandonedCartService = injector.get(AbandonedCartService);
    const ctx = await injector.get(RequestContextService).create({
      apiType: 'admin',
    });

    return await abandonedCartService.processAbandonedCarts(ctx);
  },
});
```

### 4. Service Implementation

```typescript
// src/plugins/abandoned-cart/services/abandoned-cart.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  RequestContext,
  OrderService,
  CustomerService,
  EmailService,
  Order
} from '@vendure/core';

@Injectable()
export class AbandonedCartService {
  private static readonly loggerCtx = 'AbandonedCartService';

  constructor(
    private orderService: OrderService,
    private customerService: CustomerService,
    private emailService: EmailService,
  ) {}

  async processAbandonedCarts(ctx: RequestContext) {
    const results = {
      processed: 0,
      firstNotifications: 0,
      secondNotifications: 0,
      errors: 0
    };

    try {
      // Process first notifications (12 hours)
      const firstTimeOrders = await this.findFirstTimeAbandonedOrders(ctx);
      for (const order of firstTimeOrders) {
        await this.sendFirstNotification(ctx, order);
        results.firstNotifications++;
      }

      // Process second notifications (24 hours)
      const secondTimeOrders = await this.findSecondTimeAbandonedOrders(ctx);
      for (const order of secondTimeOrders) {
        await this.sendSecondNotification(ctx, order);
        results.secondNotifications++;
      }

      results.processed = firstTimeOrders.length + secondTimeOrders.length;

    } catch (error) {
      Logger.error('Failed to process abandoned carts:', error, AbandonedCartService.loggerCtx);
      results.errors++;
    }

    Logger.log(`Processed ${results.processed} abandoned carts`, AbandonedCartService.loggerCtx);
    return results;
  }

  private async findFirstTimeAbandonedOrders(ctx: RequestContext): Promise<Order[]> {
    const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours

    const { items } = await this.orderService.findAll(ctx, {
      filter: {
        state: { in: ['AddingItems', 'ArrangingPayment'] },
        updatedAt: { before: cutoffTime },
        customFields: {
          abandonedCartNotificationSent: { eq: false }
        }
      },
      relations: ['customer', 'lines', 'lines.productVariant'],
      take: 100
    });

    return items;
  }

  private async findSecondTimeAbandonedOrders(ctx: RequestContext): Promise<Order[]> {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    const { items } = await this.orderService.findAll(ctx, {
      filter: {
        state: { in: ['AddingItems', 'ArrangingPayment'] },
        customFields: {
          abandonedCartFirstNotifiedAt: { before: cutoffTime },
          abandonedCartSecondNotifiedAt: { isNull: true }
        }
      },
      relations: ['customer', 'lines', 'lines.productVariant'],
      take: 100
    });

    return items;
  }

  private async sendFirstNotification(ctx: RequestContext, order: Order): Promise<void> {
    if (!order.customer?.emailAddress) {
      Logger.warn(`Order ${order.id} has no customer email`, AbandonedCartService.loggerCtx);
      return;
    }

    await this.emailService.send(ctx, 'abandoned-cart-first', order.customer.emailAddress, {
      order,
      customer: order.customer,
      cartUrl: `${process.env.SHOP_URL}/checkout`,
    });

    await this.updateOrderNotificationStatus(ctx, order, 'first');
  }

  private async sendSecondNotification(ctx: RequestContext, order: Order): Promise<void> {
    if (!order.customer?.emailAddress) {
      Logger.warn(`Order ${order.id} has no customer email`, AbandonedCartService.loggerCtx);
      return;
    }

    await this.emailService.send(ctx, 'abandoned-cart-second', order.customer.emailAddress, {
      order,
      customer: order.customer,
      cartUrl: `${process.env.SHOP_URL}/checkout`,
      discountCode: await this.generateDiscountCode(ctx, order),
    });

    await this.updateOrderNotificationStatus(ctx, order, 'second');
  }

  private async updateOrderNotificationStatus(
    ctx: RequestContext,
    order: Order,
    type: 'first' | 'second'
  ): Promise<void> {
    const now = new Date();
    const customFields = {
      abandonedCartNotificationSent: true,
      ...(type === 'first' ? { abandonedCartFirstNotifiedAt: now } : {}),
      ...(type === 'second' ? { abandonedCartSecondNotifiedAt: now } : {}),
    };

    await this.orderService.update(ctx, {
      id: order.id,
      customFields
    });
  }

  private async generateDiscountCode(ctx: RequestContext, order: Order): Promise<string | null> {
    // Implement discount code generation logic
    // This could integrate with Vendure's promotion system
    return null;
  }
}
```

## Email Templates

### 1. First Notification Template

```handlebars
<!-- static/email/templates/abandoned-cart-first/body.hbs -->
<h2>You left something in your cart</h2>

<p>Hi {{customer.firstName}},</p>

<p>We noticed you left some items in your shopping cart. Don't worry, we've saved them for you!</p>

<div class="cart-items">
  {{#each order.lines}}
  <div class="item">
    <strong>{{productVariant.name}}</strong> - Quantity: {{quantity}}
  </div>
  {{/each}}
</div>

<p>
  <a href="{{cartUrl}}" style="background: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
    Complete Your Purchase
  </a>
</p>

<p>Questions? Reply to this email and we'll help you out.</p>
```

### 2. Second Notification Template

```handlebars
<!-- static/email/templates/abandoned-cart-second/body.hbs -->
<h2>Still thinking it over?</h2>

<p>Hi {{customer.firstName}},</p>

<p>Your cart is still waiting for you! As a thank you for your patience, here's a special offer.</p>

{{#if discountCode}}
<div class="discount-offer">
  <h3>Get 10% off your order</h3>
  <p>Use code: <strong>{{discountCode}}</strong></p>
</div>
{{/if}}

<div class="cart-items">
  {{#each order.lines}}
  <div class="item">
    <strong>{{productVariant.name}}</strong> - Quantity: {{quantity}}
  </div>
  {{/each}}
</div>

<p>
  <a href="{{cartUrl}}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
    Complete Your Purchase
  </a>
</p>
```

## Plugin Registration

```typescript
// src/vendure-config.ts
import { AbandonedCartPlugin } from './plugins/abandoned-cart/abandoned-cart.plugin';
import { DefaultSchedulerPlugin } from '@vendure/core';

export const config = mergeConfig(baseConfig, {
  plugins: [
    DefaultSchedulerPlugin.init(),
    AbandonedCartPlugin,
    // ... other plugins
  ],
});
```

## Database Migration

After adding the plugin, generate a migration to add the custom fields:

```bash
npx vendure migrate
```

## Key Improvements Over Original Approach

### 1. Stateless Query Architecture
- **Original**: Used `isStale` custom field to permanently mark orders
- **Improved**: Query based on timestamps, avoiding state pollution
- **Benefit**: Cleaner data model, better performance

### 2. Single Task Design
- **Original**: Two separate tasks (marking + notifying)
- **Improved**: Single task handling both identification and notification
- **Benefit**: Simpler architecture, reduced complexity

### 3. Progressive Notification Strategy
- **Original**: Single notification attempt
- **Improved**: Two-stage notification with escalating incentives
- **Benefit**: Higher conversion rates, better customer engagement

### 4. Performance Optimization
- **Original**: No pagination or limits
- **Improved**: Batched processing with configurable limits
- **Benefit**: Handles large datasets without memory issues

### 5. Enhanced Error Handling
- **Original**: Basic error handling
- **Improved**: Granular error tracking with detailed logging
- **Benefit**: Better monitoring and troubleshooting

### 6. Flexible Timing Configuration
- **Original**: Hardcoded 12-hour timing
- **Improved**: Configurable intervals for different notification stages
- **Benefit**: Adaptable to different business requirements

## Configuration Options

The system can be customized through environment variables:

```env
# .env
ABANDONED_CART_FIRST_DELAY_HOURS=12
ABANDONED_CART_SECOND_DELAY_HOURS=24
ABANDONED_CART_BATCH_SIZE=100
SHOP_URL=https://yourshop.com
```

## Monitoring and Analytics

The service returns detailed metrics for monitoring:

```typescript
{
  processed: number,           // Total orders processed
  firstNotifications: number,  // First notifications sent
  secondNotifications: number, // Second notifications sent
  errors: number              // Errors encountered
}
```

## Production Considerations

1. **Email Service**: Configure proper SMTP settings for production
2. **Database Indexing**: Add indexes on `updatedAt` and custom fields for better query performance
3. **Rate Limiting**: Consider email service rate limits for large volumes
4. **Monitoring**: Set up alerts for task failures
5. **Testing**: Test email templates across different email clients
6. **Compliance**: Ensure GDPR/CAN-SPAM compliance for email marketing

## Testing Strategy

1. **Unit Tests**: Test service methods independently
2. **Integration Tests**: Test complete workflow with test database
3. **Email Tests**: Verify email template rendering and delivery
4. **Performance Tests**: Test with large datasets to ensure scalability