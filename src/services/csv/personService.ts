import { randomUUID } from "crypto";
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';

import { Person } from '../../Interfaces/PersonInterface';


export const fetchPeople = async () => {
  let people: Person[] = [];
  people = await readPeopleFromCSV('../../lib/event-reminder/data/family_members.csv');
  return people;
}

export const fetchPerson = async (id: string) => {
  let people: Person[] = [];
  people = await readPeopleFromCSV('../../lib/event-reminder/data/family_members.csv');
  return people.find((person) => person.id === id);
}

export const createPerson = async (person: Person) => {
  try {
    const csvPath = path.join(__dirname, '../../lib/event-reminder/data/family_members.csv');
    await insertPersonToCSV(csvPath, person);
    return person;
  } catch (error) {
    console.error(`Error creating person: ${error}`);
    throw error;
  }
}

export const readPeopleFromCSV = (filePath: string): Promise<Person[]> => {
  try {
    return new Promise((resolve, reject) => {
      const people: Person[] = [];
      fs.createReadStream(path.resolve(__dirname, filePath))
      .pipe(csvParser())
      .on('data', (data: any) => {
        people.push({
          id: data.id,
          firstname: data.firstname,
          middlename: data.middlename,
          lastname: data.lastname,
          gender: data.gender,
          birthDate: data.birthDate,
          weddingDate: data.weddingDate,
          deathDate: data.deathDate,
          spouses: data.spouses,
          parents: data.parents,
        });
      })
      .on('end', () => {
        resolve(people);
      })
      .on('error', (error) => {
        reject(error);
      });
    });
  }  catch (error) {
    console.error(`Error reading recipients from CSV: ${error}`);
    throw error;
  }
}

export const insertPersonToCSV = (filePath: string, data: Person) => {
  const id = randomUUID();
  const {
    firstname,
    middlename,
    lastname,
    gender,
    birthDate,
    weddingDate,
    deathDate,
    spouses,
    parents,
  } = data;
  const line = `${id},${firstname},${middlename},${lastname},${birthDate},${gender},${parents},${weddingDate},${spouses},${deathDate}\n`;
console.log(`Inserting line: ${line}, into ${filePath}`); // Debugging line
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    const headers = 'id,firstname,middlename,lastname,birthDate,gender,parents,weddingDate,spouses,deathDate\n';
    fs.writeFileSync(filePath, headers +line, 'utf8');
    console.log('CSV file created and line inserted.');
  } else {
    fs.appendFileSync(filePath, line, 'utf8');
    console.log('Line appended to existing CSV file.');
  }
}
