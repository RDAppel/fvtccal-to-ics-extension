(() => {

	const getRoomAssingments = () => {
		const schedule = document.querySelectorAll("[id^='ptModFrame_']")?.[0]?.contentWindow
		if (!schedule) {
			alert('Please open your weekly teaching schedule first!')
			return
		}

		const selector = '#WEEKLY_SCHED_HTMLAREA span > br:first-child'
		const scheduleInfo = [...schedule.document.querySelectorAll(selector)].map(el => {
			const getText = node => node.textContent.trim()
			const items = [...el.closest('span').childNodes].filter(getText).map(getText)
			const [courseIdLong, , , room] = items
			return JSON.stringify({ courseIdLong, room })
		})

		const roomAssignments = [...new Set(scheduleInfo)].map(JSON.parse)
			.reduce((acc, { courseIdLong, room }) => {
				return { ...acc, [courseIdLong.replace(' - ', '-')]: room }
			}, {})

		return roomAssignments
	}

	const roomAssignments = getRoomAssingments()
	if (!roomAssignments) return

	const main = document.querySelector('#main_target_win0').contentWindow
	const rows = main.document.querySelectorAll("[id^='trINSTR_CLASS_VW']")

	const classData = [...rows].map(row => {
		const [id, sectionText] = row.querySelector("[id^='CLASS_TITLE']")?.textContent?.split('\n') || []
		if (!id) return null
		const room = roomAssignments[id]
		if (!room) return null
		const titleText = row.querySelector("[id^='CLASSTIT']")?.textContent?.trim()
		if (!titleText) return null
		const daysAndTimes = row.querySelector("[id^='DERIVED_AA2_REQDESCRA']")?.textContent?.trim()?.replace(' - ', '-')
		if (!daysAndTimes) return null
		const datesText = row.querySelector("[id^='DERIVED_AA2_REQDESCRC']")?.textContent?.trim()
		if (!datesText) return null
		return { titleText, sectionText, room, daysAndTimes, datesText }
	}).filter(Boolean)

	const events = classData.map(({ titleText, sectionText, room, daysAndTimes, datesText }) => {
		const [title] = titleText.split(' (')
		const section = sectionText.trim()
		const [daysText, timesText] = daysAndTimes?.split(' ') || []
		const days = daysText.toUpperCase().match(/.{1,2}/g)

		const formatTime = t => t.replace('AM', ' am').replace('PM', ' pm')
		const [startTime, endTime] = timesText.split('-').map(formatTime)

		const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
		const formatDate = d => {
			const [ month, day, year ] = d.replace(', ', ' ').split(' ')
			return `${months.indexOf(month) + 1}/${day}/${year}`
		}
		const [startDate, endDate] = datesText.split(' (')[0].split('-\n').map(formatDate)

		const start = `${startDate} ${startTime}`
		const end = `${startDate} ${endTime}`

		const rrule = {
			freq: 'WEEKLY',
			byday: days,
			until: new Date(`${endDate} 23:59:59`)
		}

		return [ title, section, room, start, end, rrule ]
	})

	const instructor = main.document.querySelector('#DERIVED_SSTSNAV_PERSON_NAME').innerText.toLowerCase().replace(/ /g, "-")

	const calendar = ics()
	events.forEach(event => calendar.addEvent(...event))
	calendar.download(`${instructor}-schedule`)
})()