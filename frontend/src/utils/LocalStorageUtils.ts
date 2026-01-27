/* TEMPLATE */
export const getLocalStorageObjProperty = (key: string, property: string) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    return parsed[property] || null;
};