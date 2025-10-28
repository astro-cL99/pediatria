import { useState, useCallback } from 'react';

type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K]) => { isValid: boolean; message?: string };
};

type FormErrors<T> = {
  [K in keyof T]?: string;
};

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules<T> = {},
  onSubmit: (values: T) => Promise<void> | void
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof T, value: any): boolean => {
      const validator = validationRules[name];
      if (validator) {
        const result = validator(value);
        if (!result.isValid) {
          setErrors((prev) => ({
            ...prev,
            [name]: result.message,
          }));
          return false;
        }
        // Clear error if validation passes
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
      return true;
    },
    [validationRules]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    Object.keys(values).forEach((key) => {
      const fieldName = key as keyof T;
      const validator = validationRules[fieldName];
      if (validator) {
        const result = validator(values[fieldName]);
        if (!result.isValid) {
          newErrors[fieldName] = result.message;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      // Handle different input types
      const inputValue = type === 'number' 
        ? parseFloat(value) || 0 
        : type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : value;

      setValues((prev) => ({
        ...prev,
        [name]: inputValue,
      }));

      // Validate field on change if it has an error
      if (errors[name as keyof T]) {
        validateField(name as keyof T, inputValue);
      }
    },
    [errors, validateField]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      validateField(name as keyof T, value);
    },
    [validateField]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (validateForm()) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Form submission error:', error);
          // You can handle form submission errors here
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [onSubmit, validateForm, values]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setValues,
    setErrors,
  };
}
