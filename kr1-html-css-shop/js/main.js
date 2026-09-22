const orderDialog = document.getElementById('order-dialog');

const orderButtons = document.querySelectorAll('.product-card__button');

const closeDialogButton = document.getElementById('close-order-dialog');

const selectedProductInput = document.getElementById('selected-product');

orderButtons.forEach((button) => {
  button.addEventListener('click', () => {

    const productName = button.dataset.product;

    selectedProductInput.value = productName;

    orderDialog.showModal();
  });
});

closeDialogButton.addEventListener('click', () => {
  orderDialog.close();
});

const orderForm = document.getElementById('order-form');

const successMessage = document.getElementById('success-message');

orderForm.addEventListener('submit', (event) => {

  event.preventDefault();

  const formElements = Array.from(orderForm.elements);

  formElements.forEach((element) => {
    if (element.willValidate) {
      element.removeAttribute('aria-invalid');
    }
  });

  if (!orderForm.checkValidity()) {
    formElements.forEach((element) => {
      if (element.willValidate && !element.checkValidity()) {
        element.setAttribute('aria-invalid', 'true');
      }
    });

    orderForm.reportValidity();
    return;
  }

  successMessage.hidden = false;

  orderForm.reset();

  orderDialog.close();
});

