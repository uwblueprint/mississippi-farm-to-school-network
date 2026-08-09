export type AnnouncementStatus = 'active' | 'scheduled' | 'expired';

export type Announcement = {
	id: string;
	message: string;
	startDate: string;
	endDate: string;
};
