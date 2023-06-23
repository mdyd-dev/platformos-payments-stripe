# platformOS Payments Stripe

A module for processing payments in platformOS using the Stripe Payment Gateway. To use the platformOS Payments Strip module, you have to have the [platformOS Payments](https://github.com/mdyd-dev/platformos-payments) module installed.  

# Installation

## Installation through the Partner Portal
1. Go to the [Module Marketplace](https://portal.apps.near-me.com/module_marketplace) and click on "Buy" (it's FREE) next to the "PlatformOS Payments" and "PlatformOS Payments Stripe" modules.
2. Go to your Instance view and install both modules. 
3. During the installation process, set up Stripe public and secret keys.
4. Make sure that `enable_sms_and_api_workflow_alerts_on_staging` in your Instance configuration is set to `true`.

## Manual installation

1. Open a terminal and go to the root directory of your Instance codebase. 
2. Install the platformOS Payment Module from our GitHub repository:
  ```
  git submodule add https://github.com/mdyd-dev/platformos-payments modules/payments
  ```
3. Install the platformOS Stripe Module from our GitHub repository:
  ```
  git submodule add https://github.com/mdyd-dev/platformos-payments-stripe modules/stripe
  ```
4. Edit `modules/stripe/template-values.json` and *set Stripe public and secret keys*
5. Deploy Instance.
6. Make sure that `enable_sms_and_api_workflow_alerts_on_staging` in your Instance configuration is set to `true`.

# Contribution

In the next paragraph, you will find the description of all actions already predefined in the module. In case you need to use any other Stripe API endpoint that has not yet been defined, please create an Issue or Pull Request.

## Adding new Request Type

Follow these steps to add a new Request Type:

1. Determine the URL and request attributes for the desired [Stripe API](https://stripe.com/docs/api)] call.
2. Create a new file in the `modules/stripe/public/notifications/api_call_notifications/[request_type].liquid` directory so that its name matches with the `request_type` e.g. the `create_payment` request_type will invoke `create_payment` api_call_notification.
3. Similar to other API notifications, set the Authorization header, set proper Stripe API endpoint URL as the `to` property, and pass the data stored in the `data` object to the request.
4. Create a form template for your request in `modules/stripe/public/notifications/api_call_notifications/[request_type].liquid`. Please note that this step is needed only if you want to include the form in the page and can be skipped if request_type is used only with GraphQL mutations.
5. Create `response_mapper`, and add `modules/stripe/public/views/partials/templates/[request_type].liquid`. This file defines the JSON object that is passed to the `create_customization` GraphQL mutation. Passing the `id` attribute will call the `update_customizations` query. Please make sure that the correspoding CustomModelType and FormConfiguration exists in the Payment Module (e.g. the `create_refund` request type creates the `modules/payments/refund` object with `modules/payments/create_refund_form`).

## Adding new webhook endpoint

If you need to add a new webhook endpoint:

1. On the Stripe Dashboard, select the event you wish to send. Webhook configuration should be already defined with the [migration](https://github.com/mdyd-dev/platformos-payments-stripe/blob/master/private/migrations/20190401101010_add_gateway_keys.liquid).
2. Stripe will send requests to the [webhook "listen" page](https://github.com/mdyd-dev/platformos-payments-stripe/blob/master/public/views/pages/webhooks/listen.liquid) where the payload is verified with a signature.
3. The webhook object is passed to the partial `modules/stripe/webhook_processors/[webhook_event_name]`, so you need to create it and invoke desired actions.

# Request Types

Each `request type` represents a different action propagated to the Stripe payment gateway through its [REST API](https://stripe.com/docs/api). In this paragraph, you will see what actions are available and you will learn how to configure them.

To learn how to include the payment_request_form and what the default configuration options are, please read the [platformOS Payments Module Readme](https://github.com/mdyd-dev/platformos-payments#gatewayruestform-configuration)

### create_customer

The `create_customer` request stores customer details in Stripe and saves the customer token in the `modules/payments/customer` object as a `gateway_id` property that can later be used to process payment without providing Credit Card details on each purchase.
For more details please see our [Customer Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/customer_example/public).

For more information see the [Stripe Customer API Example](https://stripe.com/docs/api/customers/create).

**Include Form Objects:**
  - config:
    - button: button label, if not set Stripe popup will be rendered on page load
    - button_modal: Stripe modal submit button text, default: "Pay"
    - require_zip: if set to "true", will require a customer to provide ZipCode

  - data:
    - external_id: used to create a relation between a user and any other object and customer. It is used in GraphQL query in customer lookup.
    - email: optional, customer emails, if not set will be asked to fill in in Stripe modal
    - description: optional, description of a customer
    - indempotency_key - uniq string for safely retrying requests without accidentally performing the same operation twice. [Read more](https://stripe.com/docs/api/idempotent_requests)

### create_payment

The `create_payment` request sends a [Stripe Charge API Request](https://stripe.com/docs/api/charges/create) in order to authorize or capture payment.

**Include Form Objects:**
  - config:
    - button: button label, if not set Stripe popup will be rendered on page load
    - button_modal: Stripe modal submit button text, default: "Pay"
    - require_zip: if set to "true", will require a customer to provide ZipCode

  - data:
    - external_id: used to create relation between a user and any other object and customer, it is used in GraphQL query in customer lookup
    - email: optional, customer emails, if not set will be asked to fill in in Stripe modal
    - amount: required, a positive integer representing how much to charge in the smallest currency unit
    - application_fee: A fee in cents that will be applied to the charge and transferred to the application owner’s Stripe account.
    - currency: Three-letter ISO currency code, in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).
    - description: optional, an arbitrary string which you can attach to a Charge object. [Read more](https://stripe.com/docs/api/charges/create#create_charge-description)
    - statement_descriptor: optional, an arbitrary string to be used as the dynamic portion of the full descriptor displayed on your customer’s credit card statement. [Read more](https://stripe.com/docs/api/charges/create#create_charge-statement_descriptor)
    - capture: whether to immediately capture the charge. Defaults to true.
    - customer: the ID of an existing customer that will be charged in this request.
    - destination: the ID of a connected account for processing [Stripe Connect Payments](https://stripe.com/docs/connect). By default, it is stored as a `gateway_id` property of the `modules/payments/account` object.
    - transfer_group: a string that identifies this transaction as part of a group. For details, see [Grouping transactions](https://stripe.com/docs/connect/charges-transfers#grouping-transactions).
    - source: optional, a payment source to be charged, typically a token provided by Stripe.js, but can be other sources. For more information see the [Customer Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/customer_example/public) and the implementation of the [create_payment partial](https://github.com/mdyd-dev/platformos-payments/blob/master/public/views/partials/create_payment.liquid)
    - metadata: optional, set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.
    - indempotency_key - uniq string for safely retrying requests without accidentally performing the same operation twice. [Read more](https://stripe.com/docs/api/idempotent_requests)

### capture_payment

The `capture_payment` request will trigger money transfer for an existing uncaptured, authorized payment. This is the second half of the two-step payment flow, where first you created a charge with the capture option set to false.

- config:
  - button: optional, text of the capture button

- data:
  - gateway_id: required, the ID of the Stripe charge object that you want to capture, stored in a `gateway_id` property of the `modules/payments/payment` object.
  - indempotency_key - uniq string for safely retrying requests without accidentally performing the same operation twice. [Read more](https://stripe.com/docs/api/idempotent_requests)

### create_refund

The `create_refund` request allows you to refund a charge that has previously been created but not yet refunded. Funds will be refunded to the credit or debit card that was originally charged.

- config:
  - button: optional, text of the refund button

- data:
  - charge: required, the ID of the Stripe charge object that you want to capture, stored in a `gateway_id` property of the `modules/payments/payment` object.
  - payment_id: ID of the `modules/payments/payment` object used to create a relationship with the `modules/payments/refund` object
  - amount: optional, a positive integer in cents representing how much of this charge to refund. Can refund only up to the remaining, unrefunded amount of the charge.
  - reason: a string indicating the reason for the refund. Possible values are `duplicate`, `fraudulent`, and `requested_by_customer`.
  - refund_application_fee: Boolean indicating whether the application fee should be refunded when refunding this charge. If a full charge refund is given, the full application fee will be refunded. Otherwise, the application fee will be refunded in an amount proportional to the amount of the charge refunded.
  - reverse_transfer: Boolean indicating whether the transfer should be reversed when refunding this charge. The transfer will be reversed proportionally to the amount being refunded (either the entire or partial amount).
  - metadata: optional, set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.
  - indempotency_key - uniq string for safely retrying requests without accidentally performing the same operation twice. [Read more](https://stripe.com/docs/api/idempotent_requests)

### create_account

create_account is used for account object creation in [Stripe Connect Payments.](https://stripe.com/docs/connect)


- config:
  - button: optional, text of the submit button
- data:
  - email: user email
  - external_id: ID that you can use to find a `models/payments/account` object, for example `context.current_user.id`
  - gateway_id: Stripe Account object ID, used for updating an existing account in the multi-step account creation
  - id: ID of the `models/payments/account` object, used for updating an existing account in the multi-step account creation
  - indempotency_key - uniq string for safely retrying requests without accidentally performing the same operation twice. [Read more](https://stripe.com/docs/api/idempotent_requests)

### delete_account

delete_account with [Stripe Connect Payments](https://stripe.com/docs/connect). You may delete any account in test mode, but an account in live mode may only be deleted once all balances are zero.

- config:
  - button: optional, text of the submit button
- data:
  - gateway_id: Stripe Account object ID, used for updating an existing account in the multi-step account creation
  - id - ID of `models/payments/account` object, used for updating an existing account in the multi-step account creation

### create_transfer

create_transfer is used to move money from your Stripe Account Balance to Connected Account Balance.

- data:
  - destination: Stripe Account object ID to which you want to transfer funds
  - amount: required, a positive integer representing how much to transfer in the smallest currency unit
  - currency: Three-letter ISO currency code, in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).
  - metadata: optional, set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.
  - indempotency_key - uniq string for safely retrying requests without accidentally performing the same operation twice. [Read more](https://stripe.com/docs/api/idempotent_requests)

### create_credit_card

Adds a new credit card to the customer.

- data:
  - source: credit card token - provided by the Stripe.js component
  - customer_id: Stripe Customer object ID
  - metadata: optional, set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.
  - indempotency_key - uniq string for safely retrying requests without accidentally performing the same operation twice. [Read more](https://stripe.com/docs/api/idempotent_requests)

### delete_credit_card

Used to remove credit card from an an existing customer.

- config:
  - button: optional, text of the submit button
- data:
  - id: `modules/payment/credit_card` object ID
  - customer_id: Stripe Customer object ID
  - gateway_id: Stripe Credit Card object ID

### get_account

Retrieves the details of a Stripe account. You can see things like its current requirements or if it is enabled to make live charges or receive payouts.

- data:
  - gateway_id: id of account

### get_payout

Retrieves a payout object (created when receiving funds from Stripe, or when a payout is initiated to a bank account or to a debit card of a connected Stripe account). The schedules of payouts vary depending on the country and industry.

- data:
  - payout_id: id of payout
  - account_id: id of Stripe account

### get_persons

Retrieves a list of persons (objects representing persons associated with a Stripe account).

- data:
  - gateway_id: id of Stripe account

### get_webhook_endpoints

Retrieves a list of webhook endpoints.

Webhook endpoints can be configured to be notified about events that happen in a Stripe account.

Usually webhooks are configured and tested from the dashboard.

No parameters required.
