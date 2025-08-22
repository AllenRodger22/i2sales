import type { AutomatedFollowUp } from '../types';
import { AutomatedFollowUpStatus } from '../types';

/**
 * Generates a series of automated follow-up dates based on a cadence schedule.
 * The schedule is: 3 times a day for 3 days, and 1 time on the 4th day.
 * It only schedules follow-ups that are in the future relative to the start date.
 * @param startDate The date and time from which to start scheduling.
 * @returns An array of AutomatedFollowUp objects.
 */
export const generateCadenceFollowUps = (startDate: Date): AutomatedFollowUp[] => {
    const followUps: AutomatedFollowUp[] = [];
    const scheduleHours = [10, 14, 18];

    // Generate follow-ups for 4 calendar days starting from the provided start date.
    for (let dayIndex = 0; dayIndex < 4; dayIndex++) {
        const targetDay = new Date(startDate);
        // Set the date to the correct future day for scheduling
        targetDay.setDate(startDate.getDate() + dayIndex);

        // On the 4th day (dayIndex === 3), the schedule is only for 10:00.
        const hoursForThisDay = (dayIndex < 3) ? scheduleHours : [10];

        for (const hour of hoursForThisDay) {
            const followUpDate = new Date(targetDay);
            followUpDate.setHours(hour, 0, 0, 0);

            // Only schedule the follow-up if its calculated time is in the future.
            if (followUpDate > startDate) {
                followUps.push({
                    id: `cadence-${followUpDate.getTime()}`, // Unique ID based on timestamp
                    date: followUpDate.toISOString(),
                    status: AutomatedFollowUpStatus.Pending,
                });
            }
        }
    }
    return followUps;
};
