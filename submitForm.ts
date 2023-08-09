export interface FormData {
  [key: string]: string | string[];
}

export async function submitForm(id: string, data: FormData) {
  const url = `https://docs.google.com/forms/d/e/${id}/formResponse`;

  const formData = new FormData();

  // Handle email address

  const email = data['emailAddress'];

  if (email) {
    if (Array.isArray(email)) {
      return {
        error: true,
        message: 'Email address cannot be an array'
      }
    } else {
      formData.append('emailAddress', email);
    }
  }

  delete data['emailAddress'];

  // Handle other fields

  Object.entries(data).forEach(([key, value]) => {
    const id = `entry.${key}`;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        formData.append(id, v);
      });
      return;
    } else {
      formData.append(id, value);
    }
  });

  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    return {
      error: true,
      message: 'Unable to submit the form. Check your form ID and email settings, and try again.'
    }
  }

  return {
    error: false,
    message: 'Form submitted successfully'
  }
}
