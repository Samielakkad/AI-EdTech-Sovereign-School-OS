import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../../types.ts';
import Button from '../common/Button.tsx';
import Select from '../common/Select.tsx';
import * as studentDataService from '../../services/studentDataService.ts';
import * as geminiService from '../../services/geminiService.ts';
import { HEROES, COUNTRIES } from '../../services/heroData.ts';

interface ProfileSettingsViewProps {
    student: StudentProfile;
    onUpdate: () => void;
}

const ALL_INTERESTS = ['Space', 'Dinosaurs', 'Art', 'Music', 'Video Games', 'Sports', 'Animals', 'History', 'Technology', 'Reading'];

const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({ student, onUpdate }) => {
    const [selectedCountry, setSelectedCountry] = useState(() => HEROES.find(h => h.name === student.selectedHero)?.country || 'International');
    const [selectedHero, setSelectedHero] = useState(student.selectedHero);
    
    const [pronouns, setPronouns] = useState(student.pronouns || 'they/them');
    const [interests, setInterests] = useState<string[]>(student.interests || []);

    const [isSaved, setIsSaved] = useState(false);
    const [heroBio, setHeroBio] = useState('');
    const [isLoadingBio, setIsLoadingBio] = useState(false);

    useEffect(() => {
        const fetchHeroBio = async () => {
            if (!selectedHero) return;
            const heroDetails = HEROES.find(h => h.name === selectedHero);
            if (!heroDetails) return;
            const cachedBio = localStorage.getItem(`hero-bio-${heroDetails.name}`);
            if (cachedBio) {
                setHeroBio(cachedBio);
                return;
            }
            setIsLoadingBio(true);
            setHeroBio('');
            try {
                const bio = await geminiService.generateHeroBio(heroDetails.name, heroDetails.description);
                localStorage.setItem(`hero-bio-${heroDetails.name}`, bio);
                setHeroBio(bio);
            } catch (error) {
                console.error("Failed to generate hero bio", error);
                setHeroBio(heroDetails.description);
            } finally {
                setIsLoadingBio(false);
            }
        };
        fetchHeroBio();
    }, [selectedHero]);

    const filteredHeroes = HEROES.filter(hero => hero.country === selectedCountry);

    useEffect(() => {
        if (!filteredHeroes.some(h => h.name === selectedHero) && filteredHeroes.length > 0) {
            setSelectedHero(filteredHeroes[0].name);
        }
    }, [selectedCountry, filteredHeroes, selectedHero]);

    const handleInterestToggle = (interest: string) => {
        setInterests(prev =>
            prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
        );
    };
    
    const handleSave = () => {
        studentDataService.updateStudentHero(student.id, selectedHero);
        studentDataService.updateStudentPersonalization(student.id, { pronouns, interests });
        onUpdate();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const currentHeroDetails = HEROES.find(h => h.name === selectedHero);
    const hasChanges = selectedHero !== student.selectedHero || pronouns !== student.pronouns || JSON.stringify(interests.sort()) !== JSON.stringify([...student.interests].sort());

    return (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-4">Personalize Your OS</h2>
                <div className="space-y-4">
                     <Select
                        label="Your Pronouns"
                        value={pronouns}
                        onChange={e => setPronouns(e.target.value)}
                    >
                        <option value="they/them">they/them</option>
                        <option value="she/her">she/her</option>
                        <option value="he/him">he/him</option>
                    </Select>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Your Interests</label>
                        <div className="flex flex-wrap gap-2">
                            {ALL_INTERESTS.map(interest => (
                                <button
                                    key={interest}
                                    onClick={() => handleInterestToggle(interest)}
                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                        interests.includes(interest) 
                                        ? 'bg-indigo-600 text-white font-semibold' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {interest}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-700">
                <h2 className="text-2xl font-bold mb-4">Choose Your Hero</h2>
                <div className="space-y-4">
                    <Select
                        label="Filter by Country/Culture"
                        value={selectedCountry}
                        onChange={e => setSelectedCountry(e.target.value)}
                    >
                        <option value="International">International</option>
                        {COUNTRIES.sort().map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </Select>
                    
                    <Select
                        label="Select Your Hero Companion"
                        value={selectedHero}
                        onChange={e => setSelectedHero(e.target.value)}
                        disabled={filteredHeroes.length === 0}
                    >
                        {filteredHeroes.map(hero => (
                            <option key={hero.name} value={hero.name}>{hero.avatar} {hero.name}</option>
                        ))}
                    </Select>
                </div>
            </div>

            <div className="p-4 bg-gray-700/50 rounded-lg min-h-[150px] flex flex-col text-center">
               {currentHeroDetails && (
                    <div className="flex-grow flex flex-col justify-center">
                        <div className="text-5xl mb-2">{currentHeroDetails.avatar}</div>
                        <p className="font-bold text-xl text-indigo-300 mb-2">{currentHeroDetails.name}</p>
                        {isLoadingBio ? (
                            <div className="flex justify-center items-center h-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400"></div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-300 text-left whitespace-pre-wrap">{heroBio}</p>
                        )}
                    </div>
               )}
            </div>
            
            <Button onClick={handleSave} disabled={isSaved || !hasChanges} className="w-full">
                {isSaved ? 'Saved!' : 'Save My Profile'}
            </Button>
        </div>
    );
};

export default ProfileSettingsView;