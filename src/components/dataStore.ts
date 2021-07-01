export const updateDataStore = (key, data) => {
    // update sessionStorage contents with user data
    window.sessionStorage.setItem(key, data);
}