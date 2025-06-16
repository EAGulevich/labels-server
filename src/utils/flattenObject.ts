export function flattenObject(
  obj: Record<string, any>,
  prefix: string = "",
  result: Record<string, any> = {},
): Record<string, any> {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          // Обработка массивов
          value.forEach((item, index) => {
            const arrayKey = `${newKey}.${index}`;
            if (typeof item === "object" && item !== null) {
              // Рекурсивная обработка объектов внутри массива
              flattenObject(item, arrayKey, result);
            } else {
              // Добавление элемента массива в результат
              result[arrayKey] = item;
            }
          });
        } else {
          // Рекурсивная обработка вложенных объектов
          flattenObject(value, newKey, result);
        }
      } else {
        // Добавление свойства в результат
        result[newKey] = value;
      }
    }
  }
  return result;
}
