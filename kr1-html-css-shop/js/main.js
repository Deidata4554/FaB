const orderDialog = document.getElementById('order-dialog');

const orderButtons = document.querySelectorAll('.product-card__button');

const closeDialogButton = document.getElementById('close-order-dialog');

const closeDialogIcon = document.getElementById('close-order-dialog-icon');

const selectedProductInput = document.getElementById('selected-product');

const dialogProduct = document.getElementById('order-dialog-product');

let lastOpenButton = null;

orderButtons.forEach((button) => {
  button.addEventListener('click', () => {

    const productName = button.dataset.product;

    selectedProductInput.value = productName;

    dialogProduct.textContent = `Товар: ${productName}`;

    lastOpenButton = button;

    orderDialog.showModal();

    document.getElementById('order-name').focus();
  });
});

closeDialogButton.addEventListener('click', () => {
  orderDialog.close();
});

closeDialogIcon.addEventListener('click', () => {
  orderDialog.close();
});

// Закрытие по клику на подложку
orderDialog.addEventListener('click', (event) => {
  if (event.target === orderDialog) {
    orderDialog.close();
  }
});

// Возврат фокуса на кнопку, открывшую окно
orderDialog.addEventListener('close', () => {
  if (lastOpenButton) {
    lastOpenButton.focus();
  }
});

const orderForm = document.getElementById('order-form');

const successMessage = document.getElementById('success-message');

const showFieldError = (element) => {
  const errorElement = document.getElementById(`${element.id}-error`);

  if (element.checkValidity()) {
    element.removeAttribute('aria-invalid');

    if (errorElement) {
      errorElement.textContent = '';
    }
    return;
  }

  element.setAttribute('aria-invalid', 'true');

  if (errorElement) {
    errorElement.textContent = element.validationMessage;
  }
};

orderForm.addEventListener('submit', (event) => {

  event.preventDefault();

  const formElements = Array.from(orderForm.elements).filter((element) => element.willValidate);

  formElements.forEach(showFieldError);

  if (!orderForm.checkValidity()) {
    const firstInvalid = formElements.find((element) => !element.checkValidity());

    firstInvalid.focus();
    return;
  }

  successMessage.hidden = false;

  orderForm.reset();

  orderDialog.close();
});

// Снимаем ошибку, как только поле исправлено
orderForm.addEventListener('input', (event) => {
  if (event.target.hasAttribute('aria-invalid')) {
    showFieldError(event.target);
  }
});
