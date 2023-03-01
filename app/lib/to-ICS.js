import config from 'config'
import icalendar from 'icalendar'
import { DateTime } from 'luxon'
import console from './console.js'
import pkg from '../../package.json' assert {type: 'json'}

export function toICS(calendar) {
	const ical = new icalendar.iCalendar()
	const tz = new icalendar.VTimezone(null, 'America/Montreal')
	const dst = tz.addComponent('DAYLIGHT')
	const std = tz.addComponent('STANDARD')

	ical.setProperty('PRODID', `-//Direction des bibliothèques - Université de Montréal//${pkg.name} v${pkg.version}//EN`);
	ical.addProperty('CALSCALE', 'GREGORIAN');
	//ical.addProperty('METHOD', 'PUBLISH');
	ical.addProperty('X-WR-TIMEZONE', 'America/Montreal');
	ical.addProperty('X-WR-CALNAME', calendar.titre);
	ical.addProperty('X-PUBLISHED-TTL', config.get('ics.ttl'));

	dst.addProperty('TZNAME', 'EDT');
	dst.addProperty('DTSTART', new Date(Date.UTC(1970, 2, 8, 2, 0, 0)));
	dst.addProperty('RRULE', {
		FREQ: 'YEARLY',
		BYMONTH: 3,
		BYDAY: '2SU'
	});
	dst.addProperty('TZOFFSETFROM', -500);
	dst.addProperty('TZOFFSETTO', -400);

	std.addProperty('TZNAME', 'EST');
	std.addProperty('DTSTART', new Date(Date.UTC(1970, 10, 1, 2, 0, 0)));
	std.addProperty('RRULE', {
		FREQ: 'YEARLY',
		BYMONTH: 11,
		BYDAY: '1SU'
	});
	std.addProperty('TZOFFSETFROM', -400);
	std.addProperty('TZOFFSETTO', -500);

	ical.addComponent(tz);

	if (calendar.evenements) {

		for (const event of calendar.evenements) {
			if (event.debut1 != '') {
				const vEvent = new icalendar.VEvent(event.id)
				const delta1 = event.debut1.split(':') // [ '09', '00' ]
				const delta2 = (event.fin2 == '23:59') ? ['24', '00'] : event.fin2.split(':') // [ '16', '30' ]
				const debut = DateTime.fromJSDate(event.date).plus({ hours: delta1[0], minutes: delta1[1] })
				const duration = ((delta2[0] - delta1[0]) * 60 + (delta2[1] - delta1[1])) * 60
				const location = `${calendar.labels.bibs[event.bibliotheque]} - ${calendar.labels.services[event.service]}`

				//vEvent.addProperty('ORGANIZER', ';CN=Direction des bibliothèques, Université de Montréal:MAILTO:unequestion@bib.umontreal.ca');
				vEvent.setDate(debut, duration);
				vEvent.setSummary(event.sommaire);
				vEvent.addProperty('LOCATION', location);

				ical.addComponent(vEvent);
			}
		}
	}

	return ical.toString();
}