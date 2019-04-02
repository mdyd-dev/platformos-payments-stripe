# platformos-payments-stripe

# Installation through Partner Portal
1. Go to [modules marketplace](https://portal.apps.near-me.com/module_marketplace) and click on "Buy" next to "PlatformOS Payments" and "PlatformOS Payments Stripe" modules.
2. Go to your Instance view and install both modules
3. In the installation process set up Stripe public and secret keys
4. Make sure enable_sms_and_api_workflow_alerts_on_staging in your instance configuration is set to true


# Manual installation

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
