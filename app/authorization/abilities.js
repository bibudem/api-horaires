import config from 'config'
import { Ability } from '@casl/ability'
import parseTemplate from 'es6-template-strings'

import console from '../lib/console.js'

const roles = config.get('security.roles');
const users = config.get('security.users');
const abilities = config.get('security.abilities');

export const Abilities = {};

const ANONYMOUS_USER = {
	role: 'default'
}

const NO_AUTH_USER = {
	role: 'admin'
}

function defineAbilitiesFor(user = ANONYMOUS_USER) {
	user.role = user.role || ANONYMOUS_USER.role;

	if (!roles.includes(user.role)) {
		throw new Error(`Unknown role: ${user.role}`);
	}
	console.info(`Loading abilities for role ${user.role}`);

	const abilityTemplate = JSON.stringify(abilities[user.role]);
	const ability = JSON.parse(parseTemplate(abilityTemplate, user));
	//debug(ability);
	console.debug('parsed template: ' + JSON.stringify(ability))
	return new Ability(ability, user);
}

export function getRoleForGroup(user, strictMatch = false) {
	//console.log(`${JSON.stringify(user)}`)
	if ('groups' in user && user.groups.length) {
		for (let item of users) {
			if (user.groups.includes(item.group)) {
				return item.role;
			}
		}
	}

	return strictMatch ? null : ANONYMOUS_USER.role;
}

/**
 * @param {User} userOrGroup
 * @return {String} role
 * @public
 */

export function getRoleFor(userOrGroup, strictMatch = false) {
	console.log(`[begin] ${JSON.stringify(userOrGroup)}`);
	console.log(`strictMatch: ${strictMatch}`)
	if (userOrGroup) {
		for (const item of users) {
			if ('group' in item && 'groups' in userOrGroup && userOrGroup.groups.includes(item.group)) {
				console.info(`is a group, and his role is: ${item.role}`);
				return item.role;
			}
			if ('login' in item && userOrGroup.login && userOrGroup.login.toLowerCase() === item.login.toLowerCase()) {
				console.info(`is a user, and his role is: ${item.role}`);
				return item.role;
			}
		}
	}

	console.info(`did not find any role for ${JSON.stringify(userOrGroup)}.`);

	return strictMatch ? null : ANONYMOUS_USER.role;
}

export function createAbilities(user) {
	if (!config.get('security.useAuth')) {
		return {
			throwUnlessCan: function throwUnlessCan() { }
		}
	}
	return user ? defineAbilitiesFor(user) : defineAbilitiesFor(ANONYMOUS_USER);
}