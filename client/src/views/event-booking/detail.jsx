import { useContext, useState } from 'react';
import {
  Animate,
  Card,
  ViewContext,
  useAPI,
  useNavigate,
  useLocation,
} from 'components/lib';

export function EventBookingDetail() {
  const viewContext = useContext(ViewContext);
  const router = useNavigate();
  const location = useLocation();
  const id = location?.pathname?.split?.('/')[4];

  const { data: user } = useAPI(`/api/user/${id}`);

  const capitalize = (str) => {
    if (typeof str !== 'string') return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const fieldList = [
    { label: 'Gender', value: capitalize(user?.gender) || '-' },
    { label: 'Profession', value: capitalize(user?.profession) || '-' },
    { label: 'Smoking', value: user?.smoking_status ? 'Yes' : 'No' },
    { label: 'Looking for', value: capitalize(user?.looking_for) || '-' },
    { label: 'Interests', value: user?.interests?.map(capitalize).join(', ') || '-' },
    { label: 'Children', value: user?.children ? 'Yes' : 'No' },
    { label: 'Relationship Goal', value: capitalize(user?.relationship_goal) || '-' },
    {
      label: 'Looking for someone',
      value:
        user?.kind_of_person === 'similar'
          ? 'Someone similar to me'
          : user?.kind_of_person === 'opposite'
          ? 'Someone who’s my opposite'
          : '-',
    },
    {
      label: 'Around new people',
      value:
        user?.feel_around_new_people === 'introvert'
          ? 'I tend to be quiet and observe at first'
          : user?.feel_around_new_people === 'extrovert'
          ? 'I easily start conversations and open up quickly'
          : user?.feel_around_new_people === 'ambivert'
          ? 'Somewhere in between, depends on the situation'
          : '-',
    },
    {
      label: 'Spending time with a partner',
      value:
        user?.prefer_spending_time === 'closeness_seeker'
          ? 'I love staying in, being cozy and connected'
          : user?.prefer_spending_time === 'activity_seeker'
          ? 'I enjoy action, new experiences and going out'
          : user?.prefer_spending_time === 'both_seeker'
          ? 'Both are important, depending on the phase'
          : '-',
    },
    {
      label: 'What describes you better?',
      value:
        user?.describe_you_better === 'structured'
          ? 'I like structure, plans and reliability'
          : user?.describe_you_better === 'free_spirited'
          ? 'I’m spontaneous and love going with the flow'
          : '-',
    },
    {
      label: 'Your role in a relationship',
      value:
        user?.describe_role_in_relationship === 'harmony'
          ? 'I’m calm, balanced, and follow the lead'
          : user?.describe_role_in_relationship === 'dominance'
          ? 'I bring energy and like to take the lead'
          : '-',
    },
  ];

  return (
    <Animate>
      <Card title="User Profile">
        <div className="p-6 bg-white rounded-2xl shadow-md space-y-10">
          {/* Top layout: Profile Info & Photos */}
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left: Info */}
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  {user?.first_name || user?.name} {user?.last_name}
                  {user?.age ? `, ${user?.age}` : ''}
                </h2>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                {fieldList.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-48 font-medium text-gray-600">
                      {item.label}:
                    </span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>

              {user?.description && (
                <blockquote className="text-gray-800 text-sm italic leading-relaxed border-l-4 border-cyan-600 pl-4 mt-6">
                  {user.description}
                </blockquote>
              )}
            </div>

            {/* Right: Photos */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
              {user?.images?.map((url, index) => (
                <div
                  key={index}
                  className="rounded-xl shadow-md overflow-hidden bg-white"
                >
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-64 object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
      </Card>
    </Animate>
  );
}
