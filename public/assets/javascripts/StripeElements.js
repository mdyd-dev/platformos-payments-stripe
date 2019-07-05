class StripeElements {
  constructor() {
    this.form = document.getElementsByClassName('create_payment')[0];
    this.tokenField = document.querySelector('[data-cc-token]');
    this.stripe = Stripe(stripe_pk);
    this.elements = this.stripe.elements();
    this.configure();
  }

  configure() {
    // Custom styling can be passed to options when creating an Element.

    var style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    };

    // Create an instance of the card Element.
    this.card = this.elements.create('card', {style});

    // Add an instance of the card Element into the `card-element` <div>.
    this.card.mount('#card-element');
    console.log('mounted');

    this.validateForm();
    this.setupFormCallbacks();
    this.submitToken();
  }

  setupFormCallbacks() {
    this.form.addEventListener('submit', async event => {
      event.preventDefault();
      const {token, error} = await this.stripe.createToken(this.card);

      if (error) {
        // Inform the customer that there was an error.
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = error.message;
      } else {
        // Send the token to your server.
        this.stripeTokenHandler(token);
      }
    });
  }

  validateForm() {
    this.card.addEventListener('change', ({error}) => {
      const displayError = document.getElementById('card-errors');
      if (error) {
        displayError.textContent = error.message;
      } else {
        displayError.textContent = '';
      }
    });
  }

  submitToken() {
    this.stripeTokenHandler = token => {
      // Insert the token ID into the form so it gets submitted to the server
      this.tokenField.value = token.id;

      // Submit the form
      this.form.submit();
    };
  }
}

new StripeElements();
