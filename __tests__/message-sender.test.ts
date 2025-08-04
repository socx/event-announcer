import {
  FamilyMember,
  getMonthCelebrants,
  getTodayCelebrants,
} from '../src/lib/event-reminder/message-sender';


describe('getMonthCelebrants', () => {
  it('should return empty arrays when no family members are provided', () => {
    const familyMembers: FamilyMember[] = [];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });

  it('should return empty arrays when family members have no valid dates', () => {
    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: undefined, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: undefined, weddingDate: undefined, deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });

  it('should return birthdays for the current month', () => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: new Date(today.getFullYear(), currentMonth, 15), weddingDate: undefined, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), currentMonth, 20), weddingDate: undefined, deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual(familyMembers);
    expect(anniversaries).toEqual([]);
  });

  it('should return anniversaries for the current month', () => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: new Date(today.getFullYear(), currentMonth, 15), deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: undefined, weddingDate: new Date(today.getFullYear(), currentMonth, 20), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual(familyMembers);
  });

  it('should return both birthdays and anniversaries for the current month', () => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: new Date(today.getFullYear(), currentMonth, 15), weddingDate: new Date(today.getFullYear(), currentMonth, 20), deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), currentMonth, 10), weddingDate: new Date(today.getFullYear(), currentMonth, 25), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual(familyMembers);
    expect(anniversaries).toEqual(familyMembers);
  });

  it('should exclude birthdays and anniversaries outside the current month', () => {
    const today = new Date();
    const currentMonth = today.getMonth();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: new Date(today.getFullYear(), currentMonth - 1, 15), weddingDate: new Date(today.getFullYear(), currentMonth + 1, 20), deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), currentMonth + 1, 10), weddingDate: new Date(today.getFullYear(), currentMonth - 1, 25), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getMonthCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });
});


describe('getTodayCelebrants', () => {
  it('should return empty arrays when no family members are provided', () => {
    const familyMembers: FamilyMember[] = [];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });

  it('should return empty arrays when family members have no valid dates', () => {
    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: undefined, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: undefined, weddingDate: undefined, deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });

  it('should return birthdays for today', () => {
    const today = new Date();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: undefined, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), weddingDate: undefined, deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: undefined, deathDate: undefined, spouses: [] },
    ]);
    expect(anniversaries).toEqual([]);
  });

  it('should return anniversaries for today', () => {
    const today = new Date();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: today, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: undefined, weddingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: undefined, weddingDate: today, deathDate: undefined, spouses: [] },
    ]);
  });

  it('should return both birthdays and anniversaries for today', () => {
    const today = new Date();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: today, deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), weddingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: today, deathDate: undefined, spouses: [] },
    ]);
    expect(anniversaries).toEqual([
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: today, weddingDate: today, deathDate: undefined, spouses: [] },
    ]);
  });

  it('should exclude birthdays and anniversaries not matching today', () => {
    const today = new Date();

    const familyMembers: FamilyMember[] = [
      { id: '1', firstname: 'John', middlename: '', lastname: 'Doe', gender: 'Male', parents: [], birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), weddingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), deathDate: undefined, spouses: [] },
      { id: '2', firstname: 'Jane', middlename: '', lastname: 'Smith', gender: 'Female', parents: [], birthDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), weddingDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), deathDate: undefined, spouses: [] },
    ];
    const { birthdays, anniversaries } = getTodayCelebrants(familyMembers);

    expect(birthdays).toEqual([]);
    expect(anniversaries).toEqual([]);
  });
});
