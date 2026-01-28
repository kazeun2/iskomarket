import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';

interface CommunityGuidelinesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityGuidelines({ isOpen, onClose }: CommunityGuidelinesProps) {
  const guidelines = [
    {
      number: '1',
      title: 'Be Respectful',
      mainRule: 'Use kind and appropriate language in chats and comments.',
      details: [
        'Hate speech, harassment, and offensive messages may lead to warnings or messaging bans.'
      ]
    },
    {
      number: '2',
      title: 'Verified Student Accounts Only',
      mainRule: 'Sign up using your official CvSU email.',
      details: [
        'One verified account per student.',
        'Fake or duplicate accounts may be suspended.'
      ]
    },
    {
      number: '3',
      title: 'Safe Meet-ups Only Inside Campus',
      mainRule: 'All transactions must happen inside CvSU (Gate 1, Gate 2, or U-Mall Gate).',
      details: [
        'Never share personal addresses or meet outside school.'
      ]
    },
    {
      number: '4',
      title: 'Honest Buying & Selling',
      mainRule: 'Post only real and available items.',
      details: [
        'Do not mislead buyers with edited or false photos.',
        'Suspicious or fake listings may be removed.'
      ]
    },
    {
      number: '5',
      title: 'Official CvSU Market Items',
      mainRule: 'Uniforms, books, and other official items shown in the CvSU Market page must be bought only at the Marketing Office.',
      details: []
    },
    {
      number: '6',
      title: 'For-a-Cause Sales',
      mainRule: 'Allowed for real personal or community fundraisers.',
      details: [
        'Fake donation drives or misuse may lead to suspension.'
      ]
    },
    {
      number: '7',
      title: 'Ratings & Reporting',
      mainRule: 'Rate buyers and sellers after transactions.',
      details: [
        'Report fake listings, scams, or abusive users.',
        'Admins review all reports before action.'
      ]
    },
    {
      number: '8',
      title: 'Credit Score System',
      mainRule: 'Every student starts at 70 points.',
      details: [
        'Violations reduce your score automatically.',
        '60 points → 3-day suspension',
        'Reaching 60 again → Up to 30-day suspension',
        'Positive behavior maintains trust.'
      ]
    },
    {
      number: '9',
      title: 'Inactivity Policy',
      mainRule: 'Stay active to keep your account visible.',
      details: [
        '30 days inactive → Account on Hold',
        '100 days inactive → Deactivated',
        '180 days inactive → Permanent removal'
      ]
    },
    {
      number: '10',
      title: 'Daily Spin for IsKoins (Elite Users Only)',
      mainRule: 'Only students with 100 Credit Score can use the Daily Spin.',
      details: [
        'You get: 1 free spin per day',
        'Up to 3 extra spins (cost: 2 IsKoins each)',
        'Rewards: 0–7 IsKoins',
        'Limits apply to prevent abuse (weekly & monthly caps).'
      ]
    },
    {
      number: '11',
      title: 'Trust Level Colors & Ranks',
      mainRule: 'Your profile, progress ring, and badges follow trust tiers: Red → Orange → Yellow → Green → Cyan (Elite).',
      details: [
        'Your rank updates automatically based on your behavior and score.'
      ]
    },
    {
      number: '12',
      title: 'Rank-Up Celebrations',
      mainRule: 'When your trust tier increases, you will see a short rank-up banner.',
      details: [
        'This keeps your progress rewarding and transparent.'
      ]
    },
    {
      number: '13',
      title: 'Seasonal Reset (Every Semester)',
      mainRule: 'Credit scores adjust at the end of each season to keep the marketplace fair.',
      details: [
        'Top performers receive badges and appear on seasonal highlights.'
      ]
    },
    {
      number: '14',
      title: 'Top Buyers & Sellers',
      mainRule: 'Each month: Top 5 Sellers may have a product highlighted. Top 5 Buyers receive a priority messaging tag.',
      details: []
    },
    {
      number: '15',
      title: 'Reward Chest & IsKoin Use',
      mainRule: 'IsKoins can be redeemed for premium features.',
      details: [
        'Using a reward deducts the required IsKoins and may have cooldowns.',
        'If you drop below 100 credit score, your IsKoins become locked until you recover your trust level.'
      ]
    },
    {
      number: '16',
      title: 'Reward Expiry',
      mainRule: 'Some rewards have time limits.',
      details: [
        'Expired rewards are automatically removed to keep the system fair.'
      ]
    },
    {
      number: '17',
      title: 'Automated Moderation',
      mainRule: 'The system automatically handles violations and notifications.',
      details: [
        'Offensive messages',
        'Violations',
        'Credit score deductions',
        'Warning notices and suspensions',
        'OTP verification',
        'Notification and leaderboard updates'
      ]
    },
    {
      number: '18',
      title: 'Chat & Transaction Rules',
      mainRule: 'Meet-ups must be confirmed by both parties.',
      details: [
        'Completed transactions open the rating modal for feedback.',
        'Marking a chat as "Done" disables meet-up options unless undone.',
        'Only students who actually transacted can rate each other.'
      ]
    },
    {
      number: '19',
      title: 'Appeals',
      mainRule: 'If a transaction fails or you disagree with a system decision, you may submit an appeal for review.',
      details: [
        'Admins will verify and respond fairly.'
      ]
    },
    {
      number: '20',
      title: 'Secure Deactivation & Recovery',
      mainRule: 'Account deletion requires password confirmation.',
      details: [
        'Deleted accounts can be restored within 30 days.',
        'After 30 days, accounts are permanently removed.'
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="community-guidelines-modal p-0 gap-0 max-w-[560px] border-none shadow-none overflow-hidden"
        style={{
          background: 'transparent',
          boxShadow: 'none'
        }}
      >
        {/* Accessibility - Hidden from visual display but read by screen readers */}
        <DialogTitle className="sr-only">
          Community Guidelines
        </DialogTitle>
        <DialogDescription id="community-guidelines-description" className="sr-only">
          Keeping CvSU Market Safe and Fair - Review our 20 community guidelines for safe and responsible marketplace use
        </DialogDescription>

        {/* Premium Glass Container */}
        <div 
          className="relative rounded-[24px] border border-[rgba(0,255,155,0.14)] overflow-hidden bg-[var(--card)] dark:backdrop-blur-[28px]"
        >
          {/* Dark mode gradient + shadow layer (absolute so light mode stays solid) */}
          <div 
            className="absolute inset-0 pointer-events-none dark:block hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(1, 26, 18, 0.85) 0%, rgba(3, 31, 23, 0.85) 100%)',
              boxShadow: '0px 0px 30px rgba(0, 255, 155, 0.06), inset 0 0 18px rgba(0, 0, 0, 0.45)'
            }}
          />
          {/* Noise Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
              mixBlendMode: 'overlay',
              opacity: 0.03
            }}
          />

          {/* Light Mode Background Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-100"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #F6FFF9 100%)',
              borderRadius: '24px',
              zIndex: 0
            }}
          />

          {/* Header - Fixed */}
          <div 
            className="sticky top-0 z-10 px-8 pt-8 pb-6"
            style={{
              background: 'transparent'
            }}
          >
            <div className="text-center relative">
              <h2 
                className="text-[24px] font-semibold mb-2 leading-tight dark:text-[#C8FFE2] text-[#064B2C]"
              >
                Community Guidelines
              </h2>
              <p 
                className="text-[14px] font-medium leading-relaxed dark:text-[#96E8C1] text-[#3C6F57]"
              >
                Keeping CvSU Market Safe and Fair
              </p>
            </div>
          </div>

          {/* Divider */}
          <div 
            className="mx-8"
            style={{
              height: '1px',
              background: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Light Mode Divider */}
            <div 
              className="dark:opacity-0 opacity-100"
              style={{
                height: '1px',
                background: 'rgba(0, 0, 0, 0.06)',
              }}
            />
          </div>

          {/* Scrollable Content */}
          <div 
            className="guidelines-scroll-container overflow-y-auto px-8 py-6"
            style={{
              maxHeight: 'calc(75vh - 240px)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style>
              {`
                .guidelines-scroll-container::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>

            <div className="space-y-6">
              {guidelines.map((guideline, index) => (
                <div 
                  key={index} 
                  className="guideline-card relative rounded-[18px] bg-[var(--card)] border border-[rgba(0,255,155,0.10)] p-5 transition-all duration-300"
                >
                  {/* Dark mode background layer */}
                  <div className="absolute inset-0 pointer-events-none dark:block hidden" style={{ background: 'linear-gradient(135deg, rgba(6, 37, 26, 0.6) 0%, rgba(5, 32, 23, 0.6) 100%)', boxShadow: '0 0 14px rgba(0, 255, 155, 0.04)' }} />
                  {/* Light Mode Card Overlay */}
                  <div 
                    className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-100"
                    style={{
                      background: '#F8FFFA',
                      borderRadius: '18px',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.06)'
                    }}
                  />

                  <div className="relative z-10">
                    {/* Section Title with Number Badge */}
                    <div className="flex items-start gap-3 mb-4">
                      <div 
                        className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center"
                        style={{
                          background: 'rgba(0, 255, 155, 0.18)',
                        }}
                      >
                        <span 
                          className="text-sm font-semibold dark:text-[#5DF9A8] text-[#1E8C45]"
                        >
                          {guideline.number}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 
                          className="text-[17px] font-semibold leading-tight dark:text-[#7DFFC5] text-[#0A5C34]"
                        >
                          {guideline.title}
                        </h3>
                      </div>
                    </div>

                    {/* Main Rule - Highlighted Quote Box */}
                    <div 
                      className="relative mb-4"
                      style={{
                        borderRadius: '10px',
                        padding: '12px 16px',
                        background: 'rgba(0, 255, 155, 0.12)',
                        borderLeft: '3px solid #34E57A',
                      }}
                    >
                      {/* Light Mode Quote Box Overlay */}
                      <div 
                        className="absolute inset-0 pointer-events-none dark:opacity-0 opacity-100 -z-10"
                        style={{
                          background: '#F2FBF4',
                          borderRadius: '10px',
                          borderLeft: '3px solid #2EBD59',
                        }}
                      />
                      <p 
                        className="text-[14px] font-medium leading-[150%] relative z-10 dark:text-[#D9FFED] text-[#174C33]"
                      >
                        {guideline.mainRule}
                      </p>
                    </div>

                    {/* Details - Bullet Points */}
                    {guideline.details.length > 0 && (
                      <div>
                        <ul className="space-y-2">
                          {guideline.details.map((detail, idx) => (
                            <li 
                              key={idx} 
                              className="flex items-start gap-2 text-[14px] leading-[150%] dark:text-[#C9F7DF] text-[#456F5B]"
                            >
                              <span className="dark:text-[#7DFFC5] text-[#2EBD59] font-bold mt-0.5 flex-shrink-0">•</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div 
            className="mx-8"
            style={{
              height: '1px',
              background: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Light Mode Divider */}
            <div 
              className="dark:opacity-0 opacity-100"
              style={{
                height: '1px',
                background: 'rgba(0, 0, 0, 0.06)',
              }}
            />
          </div>

          {/* Footer - Fixed */}
          <div 
            className="sticky bottom-0 z-10 px-8 py-6"
            style={{
              background: 'transparent'
            }}
          >
            <p 
              className="text-[13px] text-center mb-6 leading-[150%] dark:text-[#9FE6C8] text-[#56786B]"
            >
              By continuing to use CvSU Market, you agree to follow these community rules and 
              uphold Cavite State University's values of respect, honesty, and responsibility.
            </p>
            <div className="flex justify-center">
              <button 
                onClick={onClose}
                className="px-12 py-3 font-semibold text-foreground transition-all relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #22C96B 0%, #119B47 100%)',
                  border: '1px solid #34E57A',
                  borderRadius: '20px',
                  boxShadow: '0px 0px 14px rgba(52, 229, 122, 0.35)',
                  fontWeight: 600,
                  fontSize: '15px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #2ADB78 0%, #13A84F 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #22C96B 0%, #119B47 100%)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.97)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.03)';
                }}
              >
                {/* Light Mode Button Overlay */}
                <div 
                  className="absolute inset-0 dark:opacity-0 opacity-100 pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, #2EBD59 0%, #1FA24A 100%)',
                    borderRadius: '20px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.10)'
                  }}
                />
                <span className="relative z-10">I Understand</span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
