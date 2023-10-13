export const logoutUser = async (sendLogout: boolean) => {
	localStorage.clear();
	window.location.reload();
};
