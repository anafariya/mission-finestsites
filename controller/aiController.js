// const joi = require('joi');
const openai = require('../model/openai');
const account = require('../model/account');
const utility = require('../helper/utility');
const mail = require('../helper/mail');
const eventModel = require('../model/event-management');
const transaction = require('../model/transaction');
const participants = require('../model/registered-participant');
const confirmMatchModel = require('../model/confirm-match');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const groupModel = require('../model/group');
const teamModel = require('../model/team');
const i18n = require('i18n');

function normalizeAgeGroup(ageGroup) {
  return ageGroup
    .replace('18-30', '18–30')
    .replace('31-40', '31–40')
    .replace('41-50+', '41–50+');
}

exports.generateTeamGroup = async function(){
  const events = await eventModel.getEventCron({ day: 5, generated: false });
  console.log(events, 'events');
  
  if(events?.length){
    const handleGroupTeams = await Promise.all(events.map(async (event) => {
      const registeredParticipants = await transaction.getByEventIdCron({ event_id: new mongoose.Types.ObjectId(event._id)})
      
      if(registeredParticipants?.length){
        const groupingAI = await openai.text({
          prompt: `
        You are matching MEETLOCAL participants into 2-person teams based on fixed duos, hard compatibility rules (Matching Zone), and soft compatibility scoring.

        ---

        ### 👥 Step 1 — Team Formation Rules

        1. Participants who signed up with an \`invited_user_id\` form a **fixed duo** and must be in the same team.
        2. All other solo participants are matched into 2-person teams using the logic below.
        3. No team can have more than 2 members.
        4. Each team must be labeled "Team 1", "Team 2", etc.

        ---

        ### 🔒 Hard Constraints — Matching Zone

        Only pair participants together if they satisfy all of the following:

        - Age difference ≤ 5 years
        - Same \`relationship_goal\`
        - Same \`children\` status (true or false)
        - Gender + Looking For are **mutually compatible**:
          - Each participant's gender must be what the other is looking for
          - Examples:
            - A woman looking for men can be paired with a man looking for women or both
            - A diverse person looking for both can be paired with anyone open to diverse

        ---

        ### 💡 Soft Compatibility (only within Matching Zone)

        If both participants have \`kind_of_person = "similar"\`:
        → Maximize personality **similarity** in:
        - feel_around_new_people
        - prefer_spending_time
        - describe_you_better
        - describe_role_in_relationship

        If both have \`kind_of_person = "opposite"\`:
        → Maximize personality **contrast** in the same 4 traits

        If one says "similar" and one says "opposite":
        → Assign **lower compatibility score**

        ---

        ### ✅ Output Format

        Respond with **valid JSON only**, no explanations.

        Each object must include:
        - team_name: string (e.g. "Team 1")
        - members: array of two members, each with:
          - id: string
          - age: number

        Do not include other data fields.

        -json
        [
          {
            "team_name": "Team 1",
            "members": [
              { "id": "uuid-1", "age": 27 },
              { "id": "uuid-2", "age": 29 }
            ]
          }
        ]

        ---

        Here is the participant list:
        ${JSON.stringify(registeredParticipants)}
        `
        });

        console.log(groupingAI, 'grouping ai');
        const match = groupingAI.match(/\[\s*{[\s\S]*}\s*\]/);

        if(match){

          const jsonString = match[0].replace(/'/g, '"')
                            .replace(/\bNone\b/g, 'null'); // Extracted JSON as string
          console.log('=============================');
          
          const data = JSON.parse(jsonString);

          console.log(JSON.stringify(data), 'data');

          if(data){
            const groupingAI2 = await openai.text({
              prompt: `
            You have a list of **2-person teams** from a MEETLOCAL event.

            Now divide these into **groups of 4 teams (8 people)** for **Slot 1** of a 3-slot event.

            ---

            ### 👥 Step 2 — Group Formation Rules

            1. Each group must contain **exactly 4 teams (8 people)**
            2. Group names must be labeled "Group 1", "Group 2", etc.
            3. Each group must be assigned a **bar** from the following list:
            ${JSON.stringify(event.bars)}
              - Each group must have a unique \`bar_id\` (no bar used twice in Slot 1)

            ---

            ### 🔒 Hard Constraints

            All members of a group must:

            - Be within a **maximum age gap of 10 years**
            - Have the same \`relationship_goal\`
            - Have the same \`children\` value (true or false)
            - Be in each other’s Matching Zone:
              - Gender + looking_for must be **mutually compatible** across group
              - Avoid groups where someone is surrounded by people they’re not interested in

            ---

            ### ⚖️ Gender Balance

            - Aim for a **gender mix** so everyone has a chance to meet someone compatible
            - Avoid grouping 8 people of the same gender unless explicitly allowed by \`looking_for\` preferences

            ---

            ### ⚙️ Optional — Soft Matching (Improve vibe compatibility)

            Within valid groups, you may prefer teams that match in:
            - kind_of_person
            - feel_around_new_people
            - prefer_spending_time
            - describe_you_better
            - describe_role_in_relationship

            But only apply this **after** hard rules are satisfied.

            ---

            ### ✅ Output Format

            Respond with valid JSON only.
            Each group must include:

            - group_name: string (e.g. "Group 1")
            - slot: 1
            - bar_id: string
            - teams: array of 4 teams:
              - team_name: string
              - members: array of:
                - id: string
                - age: number

            Do not include other participant details.

            -json
            [
              {
                "group_name": "Group 1",
                "slot": 1,
                "bar_id": "bar_id_123",
                "teams": [
                  {
                    "team_name": "Team 1",
                    "members": [
                      { "id": "uuid-1", "age": 27 },
                      { "id": "uuid-2", "age": 28 }
                    ]
                  },
                  ...
                ]
              }
            ]

            ---

            Here is the team list:
            ${JSON.stringify(data)}
            `
            });

            const groupMatch = groupingAI2.match(/\[\s*{[\s\S]*}\s*\]/);
            if(groupMatch){

              const jsonString2 = groupMatch[0].replace(/'/g, '"')
                              .replace(/\bNone\b/g, 'null'); // Extracted JSON as string
              console.log('=============================');
              
              const data2 = JSON.parse(jsonString2);
              console.log(JSON.stringify(data2), 'data2');

              const teamMap = new Map();

              // Save all teams concurrently
              const savedTeams = await Promise.all(
                data.map(async (team) => {
                  const saved = await teamModel.add({ team: { ...team, age_group: normalizeAgeGroup(team.age_group) }, eventId: event._id });
                  teamMap.set(team.team_name, saved._id);
                  return saved;
                })
              );

              // Save all groups concurrently using the saved team IDs
              await Promise.all(
                data2.map(async (group) => {
                  const team_ids = group.teams.map(t => teamMap.get(t.team_name));
                  await groupModel.add({
                    group: { ...group, age_group: normalizeAgeGroup(group.age_group) , team_ids },
                    eventId: event._id
                  });
                })
              );

              if(data2){
                const slot2Groups = await openai.text({
                  prompt: `
                You are continuing the MEETLOCAL group-building process.

                Slot 1 is already done. Now you must assign **Slot 2** groups using the same list of teams.

                ---

                ### 👥 Goal

                Reassign the existing teams into **new Slot 2 groups** of 4 teams (8 people).

                ---

                ### 🔁 New Grouping Rules for Slot 2

                1. Do **NOT** place any team in a group with another team they already met in Slot 1.
                  - "Met" = they were in the same group in Slot 1

                2. Each group must contain:
                  - 4 teams
                  - 8 total people
                  - 1 unique \`bar_id\` from the provided list
                  - No bar can be reused from Slot 1 for the same team

                3. Each team can only appear **once** in Slot 2.

                ---

                ### 🔒 Hard Constraints (same as Slot 1)

                - Max age gap within group: ≤ 10 years
                - Same \`relationship_goal\`
                - Same \`children\` status
                - Gender + looking_for must be mutually compatible across group

                ---

                ### ⚖️ Gender Mix (same as Slot 1)

                Aim for a balanced mix across all groups.
                Avoid groups with poor compatibility due to gender preference mismatches.

                ---

                ### ✅ Input

                - teams: all teams from Step 1
                - slot1_groups: previous groups with team_name and members
                - bars: all bars available for Slot 2

                ---

                ### ✅ Output Format

                Respond with **JSON only**, structured like this:

                -json
                [
                  {
                    "group_name": "Group A",
                    "slot": 2,
                    "bar_id": "bar_id_abc",
                    "teams": [
                      {
                        "team_name": "Team 4",
                        "members": [
                          { "id": "uuid-1", "age": 26 },
                          { "id": "uuid-2", "age": 25 }
                        ]
                      },
                      ...
                    ]
                  },
                  ...
                ]

                ---

                Here are the teams again:
                ${JSON.stringify(data)}

                Here were the Slot 1 groups:
                ${JSON.stringify(slot1Groups)}

                Here are the available bars:
                ${JSON.stringify(bars)}
                `
                });

                const group2Match = slot2Groups.match(/\[\s*{[\s\S]*}\s*\]/);

                if(group2Match){

                  const jsonString3 = group2Match[0].replace(/'/g, '"')
                                  .replace(/\bNone\b/g, 'null'); // Extracted JSON as string
                  console.log('=============================');
                  
                  const data3 = JSON.parse(jsonString3);
                  console.log(JSON.stringify(data3), 'data3');

                  // Save all groups concurrently using the saved team IDs
                  await Promise.all(
                    data3.map(async (group) => {
                      const team_ids = group.teams.map(t => teamMap.get(t.team_name));
                      await groupModel.add({
                        group: { ...group, age_group: normalizeAgeGroup(group.age_group) , team_ids },
                        eventId: event._id
                      });
                    })
                  );

                  const slot3Groups = await openai.text({
                    prompt: `
                  You are now creating groups for **Slot 3** of a MEETLOCAL event.

                  ---

                  ### 👥 Goal

                  Assign teams into new Slot 3 groups of 4 teams (8 people), with minimal repeat interactions.

                  ---

                  ### 🔁 Slot 3 Grouping Rules

                  1. A team **must not be grouped again** with any team they already met in **Slot 1 or Slot 2**.
                    - "Met" = appeared in the same group

                  2. Each group must include:
                    - 4 unique teams
                    - 1 bar_id not yet used by any of the 4 teams in Slot 1 or 2

                  3. A team can only appear **once** in Slot 3.

                  ---

                  ### 🔒 Hard Constraints (same as before)

                  - Max age gap within group: ≤ 10 years
                  - Same \`relationship_goal\`
                  - Same \`children\` value
                  - Gender + looking_for preferences must be mutually compatible

                  ---

                  ### ✅ Input

                  - teams: all teams
                  - previous_groups: groups from Slot 1 and Slot 2
                  - bars: remaining bars for Slot 3

                  ---

                  ### ✅ Output Format

                  -json
                  [
                    {
                      "group_name": "Group X",
                      "slot": 3,
                      "bar_id": "bar_id_xyz",
                      "teams": [
                        {
                          "team_name": "Team 7",
                          "members": [
                            { "id": "uuid-77", "age": 30 },
                            { "id": "uuid-78", "age": 29 }
                          ]
                        },
                        ...
                      ]
                    }
                  ]

                  ---

                  Here are the teams again:
                  ${JSON.stringify(data)}

                  Here were all previous groups (Slot 1 + Slot 2):
                  ${JSON.stringify([...slot1Groups, ...slot2Groups])}

                  Here are the available bars:
                  ${JSON.stringify(bars)}
                  `
                  });
                  const group3Match = slot3Groups.match(/\[\s*{[\s\S]*}\s*\]/);

                  if(group3Match){

                    const jsonString4 = group3Match[0].replace(/'/g, '"')
                                    .replace(/\bNone\b/g, 'null'); // Extracted JSON as string
                    console.log('=============================');
                    
                    const data4 = JSON.parse(jsonString4);
                    console.log(JSON.stringify(data4), 'data4');

                    // Save all groups concurrently using the saved team IDs
                    await Promise.all(
                      data4.map(async (group) => {
                        const team_ids = group.teams.map(t => teamMap.get(t.team_name));
                        await groupModel.add({
                          group: { ...group, age_group: normalizeAgeGroup(group.age_group) , team_ids },
                          eventId: event._id
                        });
                      })
                    );
                  }
                }
              }

              // update event
              await eventModel.update({ id: new mongoose.Types.ObjectId(event._id), data: {
                has_grouped_by_ai: true
              }})

              return { message: 'All teams and groups saved successfully.' };
            }
          }
        }
        
      }
    }))
  }
  
  return events
}

exports.eventStartReminder = async function(){
  const events = await eventModel.getEventCron({ day: 1, generated: true });
  if(events?.length){
    const handleGroupTeams = await Promise.all(events.map(async (event) => {
      const registeredParticipants = await participants.getRegistered({ event_id: new mongoose.Types.ObjectId(event._id), isValid: true})
      // console.log(registeredParticipants, 'registration');
      registeredParticipants && await Promise.all(registeredParticipants.map(async (reg) => {
        const team = await teamModel.getByUserId({ id: reg.user_id})
        // console.log(team, 'team');
        if(team){
          const group = await groupModel.getByTeamId({ id: team._id})
          // console.log(group, 'group');
          if(group?.length){
            const sortedGroups = group
              .sort((a, b) => a.slot - b.slot) // sort by slot ascending
              .map(group => ({
                slot: group.slot,
                group_name: group.group_name,
                bar_name: group.bar_id.name,
                bar_address: group.bar_id.address
                
              }));

            // console.log(sortedGroups, event, 'sort');
              
            const emailData = {
              name: `${reg.first_name}`,
              date: event.date && utility.formatDateString(event.date),
              email: reg.email,
              city: event.city.name,
              start_time: event.start_time,
              end_time: event.end_time,
              tagline: event.tagline,
              team_partners: team.members.map((member) => member.first_name ? `${member.first_name} ${member.last_name}` : member.name)?.join(', '),
              age_group: team.age_group,
              groups: sortedGroups
            }

            const formatTime = (date) =>
              date.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              });

            const slotDurationMinutes = 90;

            // Combine date and time into a single Date object
            const [day, month, year] = emailData.date.split('.');
            const [hour, minute] = emailData.start_time.split(':');
            const eventStart = new Date(
              Number(year),
              Number(month) - 1,
              Number(day),
              Number(hour),
              Number(minute)
            );

            const groupString = emailData.groups?.map((dt, idx) => {
              const slotStart = new Date(eventStart.getTime() + (idx * slotDurationMinutes * 60000));
              if (idx > 0) slotStart.setSeconds(slotStart.getSeconds() + 1);
              const slotEnd = new Date(slotStart.getTime() + (slotDurationMinutes) * 60000);
              if (idx > 0) slotEnd.setSeconds(slotEnd.getSeconds() - 1);

              return i18n.__('job.reminder_event.group', {
                index: dt.slot,
                slotStartTime: formatTime(slotStart),
                slotEndTime: formatTime(slotEnd),
                barName: dt.bar_name,
                barAddress: dt.bar_address,
              });
            })?.join('');

            const eventDate = new Date(Number(year), Number(month) - 1, Number(day));

            // Add 4 weeks (28 days) to get endTime
            const endDate = new Date(eventDate);
            endDate.setDate(endDate.getDate() + 28);
            // Format endTime as 'dd.mm.yyyy'
            const endTime = endDate.toLocaleDateString('en-GB'); // Outputs in 'dd/mm/yyyy'
            const endTimeFormatted = endTime.replace(/\//g, '.'); // Convert to 'dd.mm.yyyy'

            const body = i18n.__('job.reminder_event.body', {
              participantFirstName: emailData.name,
              eventDateFormatted: emailData.date,
              cityName: emailData.city,
              startTime: emailData.start_time,
              endTime: endTimeFormatted,
              eventTagline: emailData.tagline,
              teamPartnerName: emailData.team_partners,
              ageGroup: emailData.age_group,
              group: groupString,
              matchingPhaseTime: '12:00'
            })

            await mail.send({
              
              to: emailData.email,
              locale: reg.locale || 'de',
              template: 'template',
              subject: i18n.__('job.reminder_event.subject'),
              content: { 
                body,
                closing: i18n.__('job.reminder_event.closing'),
                button: {
                  url: process.env.CLIENT_URL,
                  label: i18n.__('job.reminder_event.button')
                }
              }
            })
            // console.log(emailData, body, 'emailData');
          }
          
        }
      }))
    }))
  }
  return events
}

exports.swipeEventStartReminder = async function(){
  const events = await eventModel.getSwipeEventCron({ generated: true });
  if(events?.length){
    const handleGroupTeams = await Promise.all(events.map(async (event) => {
      const registeredParticipants = await participants.getRegistered({ event_id: new mongoose.Types.ObjectId(event._id), isValid: true})
      // console.log(registeredParticipants, 'registration');
      registeredParticipants && await Promise.all(registeredParticipants.map(async (reg) => {
        const team = await teamModel.getByUserId({ id: reg.user_id})
        if(team){
          const group = await groupModel.getByTeamId({ id: team._id})
          if(group?.length){
              
            const emailData = {
              name: `${reg.first_name}`,
              date: event.date && utility.formatDateString(event.date),
              email: reg.email,
              city: event.city.name,
              start_time: event.start_time,
              end_time: event.end_time,
            }
            // Combine date and time into a single Date object
            const [day, month, year] = emailData.date.split('.');
            const eventDate = new Date(Number(year), Number(month) - 1, Number(day));

            // Add 4 weeks (28 days) to get endTime
            const endDate = new Date(eventDate);
            endDate.setDate(endDate.getDate() + 28);
            // Format endTime as 'dd.mm.yyyy'
            const endTime = endDate.toLocaleDateString('en-GB'); // Outputs in 'dd/mm/yyyy'

            const body = i18n.__('job.reminder_event_swipe.body', {
              participantFirstName: emailData.name,
              eventDateFormatted: emailData.date,
              city: emailData.city
            })

            await mail.send({
              
              to: emailData.email,
              locale: reg.locale || 'de',
              template: 'template',
              subject: i18n.__('job.reminder_event_swipe.subject'),
              content: { 
                body,
                closing: i18n.__('job.reminder_event_swipe.closing'),
                button: {
                  url: process.env.CLIENT_URL,
                  label: i18n.__('job.reminder_event_swipe.button')
                }
              }
            })
            // console.log(emailData, body, 'emailData');
          }
          
        }
      }))
    }))
  }
  return events
}

exports.eventEndReminder = async function(){
  const events = await eventModel.getEndEventCron({ generated: true });
  console.log(events, 'events');
  
  if(events?.length){
    const handleGroupTeams = await Promise.all(events.map(async (event) => {
      const registeredParticipants = await participants.getRegistered({ event_id: new mongoose.Types.ObjectId(event._id), isValid: true})
      console.log(registeredParticipants, 'registration');
      registeredParticipants && await Promise.all(registeredParticipants.map(async (reg) => {
        const team = await teamModel.getByUserId({ id: reg.user_id})
        if(team){
          const group = await groupModel.getByTeamId({ id: team._id})
          const hasConfirmedMatch = await confirmMatchModel.hasConfirmedMatch({
            eventId: new mongoose.Types.ObjectId(event._id),
            userId: new mongoose.Types.ObjectId(reg.user_id),
          });
          
          if(group?.length && !hasConfirmedMatch){
            const emailData = {
              name: `${reg.first_name}`,
              date: event.date && utility.formatDateString(event.date),
              email: reg.email,
              city: event.city.name,
              start_time: event.start_time,
              end_time: event.end_time,
            }

            const body = i18n.__('job.reminder_event_end.body', {
              participantFirstName: emailData.name,
              eventDateFormatted: emailData.date,
              city: emailData.city
            })

            await mail.send({
              
              to: emailData.email,
              locale: reg.locale || 'de',
              template: 'template',
              subject: i18n.__('job.reminder_event_end.subject'),
              content: { 
                body,
                closing: i18n.__('job.reminder_event_end.closing'),
                button: {
                  url: process.env.CLIENT_URL,
                  label: i18n.__('job.reminder_event_end.button')
                }
              }
            })
            // console.log(emailData, body, 'emailData');
          }
          
        }
      }))
    }))
  }
  return events
}