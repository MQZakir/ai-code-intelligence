import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { FaEdit, FaKey, FaSignOutAlt } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import {
  TabShell, TabHeader, TabTitle, Section, SectionHead, SectionTitle,
  MONO, TEXT, DIM, ACCENT, BORDER, CARD, ERR, OK,
} from './tabStyles';

const spin = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;

// ── Styled ────────────────────────────────────────────────────────────────────

const AvatarRing = styled.div`
  width: 52px; height: 52px; border-radius: 5px;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-family: ${MONO}; font-size: 1.2rem; color: ${ACCENT};
`;

const HeaderBlock = styled.div`
  display: flex; align-items: flex-start; gap: 0.9rem;
  padding: 1rem; border-bottom: 1px solid ${BORDER};
`;

const UserInfo = styled.div`display: flex; flex-direction: column; gap: 0.2rem;`;

const UserName = styled.div`
  font-family: ${MONO}; font-size: 0.85rem; color: ${TEXT}; font-weight: 500;
`;

const UserEmail = styled.div`font-family: ${MONO}; font-size: 0.68rem; color: ${DIM};`;

const RoleBadge = styled.span`
  display: inline-block; margin-top: 0.35rem;
  padding: 0.15rem 0.5rem; border-radius: 2px;
  background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
  font-family: ${MONO}; font-size: 0.6rem; color: ${ACCENT}; letter-spacing: 0.06em;
`;

const InfoRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.65rem 1rem; border-bottom: 1px solid #161616;
  &:last-child { border-bottom: none; }
`;

const InfoLabel = styled.div`font-family: ${MONO}; font-size: 0.65rem; color: ${DIM};`;
const InfoValue = styled.div`font-family: ${MONO}; font-size: 0.7rem; color: ${TEXT};`;

const ActionRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.65rem 1rem; border-bottom: 1px solid #161616; transition: background 0.1s;
  &:last-child { border-bottom: none; }
  &:hover { background: #131313; }
`;

const ActionBtn = styled.button<{ danger?: boolean }>`
  display: flex; align-items: center; gap: 0.45rem;
  background: transparent;
  border: 1px solid ${p => p.danger ? 'rgba(224,82,82,0.25)' : BORDER};
  border-radius: 3px; padding: 0.3rem 0.75rem; cursor: pointer; transition: all 0.12s;
  font-family: ${MONO}; font-size: 0.62rem;
  color: ${p => p.danger ? ERR : DIM};
  &:hover { border-color: ${p => p.danger ? ERR : '#333'}; color: ${p => p.danger ? ERR : TEXT}; }
`;

const Spinner = styled.div`
  width: 16px; height: 16px; border: 2px solid ${BORDER}; border-top-color: ${ACCENT};
  border-radius: 50%; animation: ${spin} 0.8s linear infinite; margin: 2rem auto;
`;

// ── Types (unchanged from original) ──────────────────────────────────────────

interface UserProfile {
  id: string; name: string; email: string | null;
  experience_level: string; created_at: string | null; last_sign_in_at: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Original fetch logic preserved exactly
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error('No user found');
        const { data: profileData, error: profileError } = await supabase.from('users').select('*').eq('id', user.id).single();
        if (profileError) throw profileError;
        setUserProfile({
          id: user.id, name: profileData.name,
          email: user.email || 'No email provided',
          experience_level: profileData.experience_level,
          created_at: user.created_at || new Date().toISOString(),
          last_sign_in_at: user.last_sign_in_at || new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // Original handlers preserved exactly
  const handleAvatarClick  = () => console.log('Change avatar clicked');
  const handleEditProfile  = () => navigate('/edit-profile');
  const handleChangePassword = () => navigate('/change-password');
  const handleNotificationSettings = () => console.log('Notification settings clicked');
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) { console.error('Error signing out:', err); }
  };

  // Original helpers preserved exactly
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase();

  const getRoleTitle = (experience: string) => {
    switch (experience.toLowerCase()) {
      case 'beginner':     return 'Beginner Programmer';
      case 'intermediate': return 'Intermediate Programmer';
      case 'expert':       return 'Expert Programmer';
      default:             return 'Programmer';
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <TabShell>
        <TabHeader><TabTitle>profile</TabTitle></TabHeader>
        <Spinner />
      </TabShell>
    );
  }

  if (error) {
    return (
      <TabShell>
        <TabHeader><TabTitle>profile</TabTitle></TabHeader>
        <div style={{ fontFamily: MONO, fontSize: '0.7rem', color: ERR, padding: '1rem' }}>{error}</div>
      </TabShell>
    );
  }

  if (!userProfile) {
    return (
      <TabShell>
        <TabHeader><TabTitle>profile</TabTitle></TabHeader>
        <div style={{ fontFamily: MONO, fontSize: '0.7rem', color: DIM, padding: '1rem' }}>no profile data available</div>
      </TabShell>
    );
  }

  return (
    <TabShell>
      <TabHeader><TabTitle>profile</TabTitle></TabHeader>

      {/* Account header */}
      <Section style={{ marginBottom: '1rem' }}>
        <SectionHead><SectionTitle>account</SectionTitle></SectionHead>
        <HeaderBlock>
          <AvatarRing onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
            {getInitials(userProfile.name)}
          </AvatarRing>
          <UserInfo>
            <UserName>{userProfile.name}</UserName>
            <UserEmail>{userProfile.email}</UserEmail>
            <RoleBadge>{getRoleTitle(userProfile.experience_level)}</RoleBadge>
          </UserInfo>
        </HeaderBlock>

        {/* Account info rows */}
        <InfoRow>
          <InfoLabel>member since</InfoLabel>
          <InfoValue>{formatDate(userProfile.created_at || '')}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>last login</InfoLabel>
          <InfoValue>{formatDate(userProfile.last_sign_in_at || '')}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>account status</InfoLabel>
          <InfoValue style={{ color: OK }}>active</InfoValue>
        </InfoRow>
      </Section>

      {/* Account actions */}
      <Section>
        <SectionHead><SectionTitle>actions</SectionTitle></SectionHead>
        <ActionRow>
          <InfoLabel>profile details</InfoLabel>
          <ActionBtn onClick={handleEditProfile}>
            <FaEdit size={10} /> edit profile
          </ActionBtn>
        </ActionRow>
        <ActionRow>
          <InfoLabel>credentials</InfoLabel>
          <ActionBtn onClick={handleChangePassword}>
            <FaKey size={10} /> change password
          </ActionBtn>
        </ActionRow>
        <ActionRow>
          <InfoLabel>session</InfoLabel>
          <ActionBtn danger onClick={handleSignOut}>
            <FaSignOutAlt size={10} /> sign out
          </ActionBtn>
        </ActionRow>
      </Section>
    </TabShell>
  );
};

export default Profile;