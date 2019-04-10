// Assumes you've already included Stripe.js!
const stripe = Stripe(stripe_pk);
console.log(stripe_pk);
const myForm = document.querySelector('.account-form');
myForm.addEventListener('submit', handleForm);

async function handleForm(event) {
  console.log("Processing");
  event.preventDefault();

  const resolved = (result) => {
    console.log('Resolved');
  }

  const rejected = (result) => {
    console.log(result);
  }

  // stripe.createToken('bank_account', {
  //   country: 'US',
  //   currency: 'usd',
  //   routing_number: '110000000',
  //   account_number: '000123456789',
  //   account_holder_name: 'Jenny Rosen',
  //   account_holder_type: 'individual',
  // }).then(function(result) {
  //   // Handle result.error or result.token
  // });
  const accountResult = await stripe.createToken('account', {
    business_type: 'company',
    company: {
      name: document.querySelector('.company [data-business-name]').value,
      phone: document.querySelector('.company [data-phone]').value,
      address: {
        line1: document.querySelector('.company [data-address]').value,
        city: document.querySelector('.company [data-city]').value,
        state: document.querySelector('.company [data-state]').value,
        postal_code: document.querySelector('.company [data-zip]').value,
      },
    },
    tos_shown_and_accepted: true,
  });


  if (accountResult.token) {
    document.querySelector('#account-token').value = accountResult.token.id;
    myForm.submit();
  }
}

