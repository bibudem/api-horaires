export default class User {
	constructor(props) {
		if (typeof props === 'string') {
			props = {
				login: props
			}
		}
		Object.assign(this, props);
	}
}