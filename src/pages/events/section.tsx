import { Calendar, MapPin, Video } from 'lucide-react';
import Link from 'next/link';
import styles from './section.module.css';
import { useEffect, useState } from 'react';
import { getEvents } from '../api/event';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';

export function formatTime(isoTime: string): string {
    return dayjs(isoTime).format('YYYY年M月D日');
}


export default function EventSection() {
    // 使用统一的认证上下文，避免重复调用 useSession
    const { status } = useAuth();
    const [events, setEvents] = useState<any[]>([])

    const loadEvents = async () => {
        try {
            const queryParams = {
                order: 'desc' as const,
                page: 1,
                page_size: 3,
                publish_status: 2,
            }

            const result = await getEvents(queryParams)

            if (result.success && result.data) {
                // 处理后端返回的数据结构
                if (result.data.events && Array.isArray(result.data.events)) {
                    setEvents(result.data.events)
                } else if (Array.isArray(result.data)) {
                    setEvents(result.data)
                } else {
                    console.warn("API 返回的数据格式不符合预期:", result.data)
                    setEvents([])
                }
            } else {
                setEvents([])
            }
        } catch (error) {
            console.error("加载活动列表异常:", error)
            setEvents([])
        }
    }

    // 组件挂载时加载数据，但避免在认证过程中重复请求
    useEffect(() => {
        if (!status || status !== 'loading') {
            loadEvents()
        }
    }, [status])

    const moreLink = events.length > 1 && events[0]?.ID ? `/events/${events[0].ID}` : '/events';

    return (
        <section className={styles.activities}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>社区活动</h2>
                    <p className={styles.sectionDescription}>
                        发现精彩活动，链接更多 Nads
                    </p>
                </div>
                <div className={styles.activitiesGrid}>
                    {events.map((event, index) => (
                        <div key={index} className={styles.activityCard}>
                            <div className={styles.activityCardGlow}></div>
                            <div className={styles.activityCardHeader}>
                                <h3 className={styles.activityTitle}>{event.title}</h3>
                            </div>
                            <div className={styles.activityCardContent}>
                                <div className={styles.activityInfo}>
                                    <div className={styles.activityInfoItem}>
                                        <Calendar className={styles.activityIcon} />
                                        {formatTime(event.start_time)}
                                    </div>
                                    <div className={styles.activityInfoItem}>
                                        {event.event_mode === '线上活动' ? (
                                            <Video className={styles.activityIcon} />
                                        ) : (
                                            <MapPin className={styles.activityIcon} />
                                        )}
                                        {event.event_mode === "线上活动" ? "线上活动" : "线下活动"}
                                    </div>
                                </div>
                                <Link href={`/events/${event.ID}`} passHref>
                                    <button className={styles.activityButton}>了解详情</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
                <div className={styles.sectionFooter}>
                    <Link href={moreLink}>
                        <button className={styles.moreButton}>
                            <Calendar className={styles.buttonIcon} />
                            查看更多活动
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
