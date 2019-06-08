# Platformos Payments Stripe

## Installation
## Installation with Partner Portal
1. Go to [modules marketplace](https://portal.apps.near-me.com/module_marketplace) and click on "Buy" next to "PlatformOS Payments" and "PlatformOS Payments Stripe" modules.
2. Go to your Instance view and install both modules
3. In the installation process set up Stripe public and secret keys
4. Make sure enable_sms_and_api_workflow_alerts_on_staging in your instance configuration is set to true


## Manual installation

1. Open terminal and go to your instance code root directory
2. Install PlatfromOS Payment Module from GitHub repository
  ```
  git submodule add https://github.com/mdyd-dev/platformos-payments modules/payments
  ```
3. Install PlatfromOS Stripe Module from GitHub repository
```
git submodule add https://github.com/mdyd-dev/platformos-payments-stripe modules/stripe
```
4. Edit `modules/stripe/template-values.json` and set Stripe public and secret keys
5. Deploy instance.
6. Make sure enable_sms_and_api_workflow_alerts_on_staging in your instance configuration is set to true


## Request Types

Each `request type` represents different action propagated to Stripe payment gateway through it's [REST API](https://stripe.com/docs/api). In this paragraph you will see what actions are available and you will learn how to configure it.

### create_customer

  create_customer request will store customer details in Stripe and save customer token in `modules/payments/customer` object as `gateway_id` property that can later be used to process payment without providing Credit Card details on each purchase.
For more details please see [Customer Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/customer_example/public)

For more information see [Stripe Customer API Example](https://stripe.com/docs/api/customers/create)

**Include Form Objects:**
  - config:
    - button - button label, if not set Stripe popup will be rendered on page load
    - button_modal - Stripe modal submit button text, default: "Pay"
    - require_zip - if set to "true", will require customer to provide ZipCode

  - data:
    - external_id - used to create relation between user on any other object and customer, it is used in GraphQL query in customer lookup
    - email - optional, customer emails, if not set will be asked to fill in in Stripe modal
    - description - optional, description of customer

### create_payment

  create_payment request sends [Stripe Charge API Request](https://stripe.com/docs/api/charges/create) in order to authrize or capture payment.

**Include Form Objects:**
  - config:
    - button - button label, if not set Stripe popup will be rendered on page load
    - button_modal - Stripe modal submit button text, default: "Pay"
    - require_zip - if set to "true", will require customer to provide ZipCode

  - data:
    - external_id - used to create relation between user on any other object and customer, it is used in GraphQL query in customer lookup
    - email - optional, customer emails, if not set will be asked to fill in in Stripe modal
    - amount - required, a positive integer representing how much to charge in the smallest currency unit
    - application_fee - A fee in cents that will be applied to the charge and transferred to the application owner’s Stripe account.
    - currency - Three-letter ISO currency code, in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).
    - description - optional, an arbitrary string which you can attach to a Charge object. [ Read more ](https://stripe.com/docs/api/charges/create#create_charge-description)
    - statement_descriptor - optional, an arbitrary string to be used as the dynamic portion of the full descriptor displayed on your customer’s credit card statement. [Read more](https://stripe.com/docs/api/charges/create#create_charge-statement_descriptor)
    - capture - whether to immediately capture the charge. Defaults to true
    - customer - the ID of an existing customer that will be charged in this request.
    - destination - the ID of a connected account for for processing [ Stripe Connect Payments. ](https://stripe.com/docs/connect). By default it is stored as `gateway_id` property of `modules/payments/account` object.
    - transfer_group - a string that identifies this transaction as part of a group. For details, see [ Grouping transactions ](https://stripe.com/docs/connect/charges-transfers#grouping-transactions).
    - source - optional, a payment source to be charged, typically a token provided by Stripe.js, but can be other source. For me information please see the [Customer Example](https://github.com/mdyd-dev/platformos-payment-examples/tree/master/modules/customer_example/public) and the implementation of [ create payment partial ](https://github.com/mdyd-dev/platformos-payments/blob/master/public/views/partials/create_payment.liquid)
    - metadata - optional, set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.

### capture_payment

capture_payment request will trigger money transfer for existing uncaptured, authorized payment. This is the second half of the two-step payment flow, where first you created a charge with the capture option set to false.

- config:
  - button - optional, text of the caputre button

- data:
  - gateway_id - required, the ID of Stripe charge object that you want to capture, stored in `gateway_id` property of `modules/payments/payment` object.

### create_refund

create_refund request allow you to refund a charge that has previously been created but not yet refunded. Funds will be refunded to the credit or debit card that was originally charged.

- config:
  - button - optional, text of the refund button

- data:
  - charge - required, the ID of Stripe charge object that you want to capture, stored in `gateway_id` property of `modules/payments/payment` object.
  - payment_id - ID of `modules/payments/payment` object used to create relationshipg with `modules/payments/refund` object
  - amount - optional, a positive integer in cents representing how much of this charge to refund. Can refund only up to the remaining, unrefunded amount of the charge.
  - reason - string indicating the reason for the refund. Possible values are: `duplicate`, `fraudulent`, and `requested_by_customer`
  - refund_application_fee - Boolean indicating whether the application fee should be refunded when refunding this charge. If a full charge refund is given, the full application fee will be refunded. Otherwise, the application fee will be refunded in an amount proportional to the amount of the charge refunded.
  - reverse_transfer - Boolean indicating whether the transfer should be reversed when refunding this charge. The transfer will be reversed proportionally to the amount being refunded (either the entire or partial amount).
  - metadata - optional, set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.

### create_account

create_account is used for account object creation in [ Stripe Connect Payments. ](https://stripe.com/docs/connect)


- config:
  - button - optional, text of the submit button
- data:
  - email - user email
  - external_id - ID that you can use for `models/payments/account` object lookup, for example `context.current_user.id`
  - gateway_id - Stripe Account object ID, used for update of existing account in multi-step account creation
  - id - ID of `models/payments/account` object, used for update of existing account in multi-step account creation


### delete_account

delete_account - with [ Stripe Connect Payments. ](https://stripe.com/docs/connect), you may delete any accounts in test mode, live mode account may only be deleted once all balances are zero.

- config:
  - button - optional, text of the submit button
- data:
  - gateway_id - Stripe Account object ID, used for update of existing account in multi-step account creation
  - id - ID of `models/payments/account` object, used for update of existing account in multi-step account creation


### create_transfer

create_transfer is used to move money from your Stripe Account Balance to Connected Account Balance.

- data:
  - destination -  Stripe Account object ID to which you want to transfer funds
  - amount - required, a positive integer representing how much to transfer in the smallest currency unit
  - currency - Three-letter ISO currency code, in lowercase. Must be a [supported currency](https://stripe.com/docs/currencies).
  - metadata - optional, set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.

### create_credit_card

Adds new credit card to the customer

- data:
  - source - credit card token - provided by Stripe.js component
  - customer_id - Stripe Customer object ID
  - metadata - optional, set of key-value pairs that you can attach to an object. This can be useful for storing additional information about the object in a structured format.



### delete_credit_card

Used to remove Credit Card from existing Customer

- config:
  - button - optional, text of the submit button
- data:
  - id - `modules/payment/credit_card` object ID
  - customer_id - Stripe Customer object ID
  - gateway_id - Stripe Credit Card object ID



TBD
### get_account
### get_payout
### get_persons
### get_webhook_endpoints


