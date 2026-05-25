export type BadgeDef = {
    slug: string
    name: string
    description: string
    icon: string
}

export const BADGE_DEFS: BadgeDef[] = [
    { slug: "first_ride",      name: "First Ride",       description: "Complete your very first rental",                    icon: "🚗" },
    { slug: "road_warrior_5",  name: "Road Warrior",     description: "Complete 5 rentals",                                icon: "🛣" },
    { slug: "loyal_10",        name: "Loyal Member",     description: "Complete 10 rentals",                               icon: "💎" },
    { slug: "supercar_club",   name: "Supercar Club",    description: "Rent a Supercar or Hypercar",                       icon: "🏎" },
    { slug: "long_haul",       name: "Long Haul",        description: "Rent a car for 7 or more consecutive days",         icon: "📅" },
    { slug: "road_explorer",   name: "Road Explorer",    description: "Reach Road Explorer tier (200 XP)",                 icon: "🗺" },
    { slug: "elite_driver",    name: "Elite Driver",     description: "Reach Elite Driver tier (500 XP)",                  icon: "⚡" },
    { slug: "vip_member",      name: "VIP Member",       description: "Reach VIP Member tier (1000 XP)",                   icon: "👑" },
    { slug: "dubai_legend",    name: "Dubai Legend",     description: "Reach Dubai Legend tier (2000 XP)",                 icon: "🌟" },
    { slug: "first_review",    name: "Trusted Reviewer", description: "Leave your first review after a completed rental",  icon: "⭐" },
]
