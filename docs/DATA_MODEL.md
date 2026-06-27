# connectX Data Model

Core entities and how they map to the product requirements.

## Entities

| Model            | File                              | Purpose                                                        |
|------------------|-----------------------------------|----------------------------------------------------------------|
| `User`           | `models/user.py`                  | Auth identity (email, password hash, role).                    |
| `AlumniProfile`  | `models/alumni_profile.py`        | Current company, title, **expertise domain**, skills (req #3). |
| `Invite`         | `models/invite.py`                | Invitation token + status to join the network (req #1).        |
| `Post`           | `models/post.py`                  | Feed post — "what I'm doing / looking for" (req #4).           |
| `Comment`        | `models/comment.py`               | Comments on posts.                                             |
| `MentorProfile` / `MentorshipSession` | `models/mentorship.py` | Paid mentorship on Rooman programs (req #2b).         |
| `Opportunity`    | `models/opportunity.py`           | Manpower requirement OR job-seeking post (req #4a/4b).         |
| `StartupProject` | `models/startup_project.py`       | StartupVarsity resource applications (req #2c).                |
| `Community` / `Group` | `models/community.py`        | Community groups for mutual help (req #2a).                    |
| `Notification`   | `models/notification.py`          | In-app notifications.                                          |

## Requirement → schema mapping

- **#1 Send invite** → `Invite` (token, email, status: pending/accepted/expired)
  driven by `services/invite_service.py` + `services/email_service.py`.
- **#2 Pitch value** → surfaced in invite email template + onboarding UI; the
  three benefit areas correspond to `mentorship`, `startup_project`, `community`.
- **#3 Registration details** → `AlumniProfile.current_company`,
  `current_title`, `expertise_domain`, `skills`.
- **#4 Internal LinkedIn feed** → `Post` (+ `Comment`); typed opportunities via
  `Opportunity.kind = hiring | seeking`.

## Opportunity.kind

```
hiring   -> senior posts manpower requirement for their team   (req #4a)
seeking  -> member looking for a role in a domain               (req #4b)
```

`services/matching_service.py` matches `seeking` posts to `hiring` posts by
`expertise_domain` and surfaces them in notifications.
