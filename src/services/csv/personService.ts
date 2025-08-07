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

export const updatePerson = async (updatedPerson: Person) => {
  try {
    const csvPath = path.join(__dirname, '../../lib/event-reminder/data/family_members.csv');
    await updatePersonInCSV(csvPath, updatedPerson);
    return updatedPerson;
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

export const updatePersonInCSV = async (filePath: string, updatedData: Person): Promise<Person>  => {
  try {
    return new Promise((resolve, reject) => {
      if (!updatedData || !updatedData.id) {
        console.log('CSV file does not exist.');
        reject(new Error('Updated data must include an id.'));
      }
      if (!fs.existsSync(filePath)) {
        console.log('CSV file does not exist.');
        reject(new Error('Error updating data'));
      }
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const lines = csvContent.trim().split('\n');
    
      const headers = lines[0].split(',');
      const updatedLines = [lines[0]]; // Start with headers
    
      let updated = false;
    
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        const rowData = Object.fromEntries(headers.map((h, idx) => [h.trim(), row[idx].trim()]));
    
        if (rowData.id === updatedData.id) {
          // Replace with updated data
          const {
            id,
            firstname,
            middlename,
            lastname,
            gender,
            birthDate,
            weddingDate,
            deathDate,
            spouses,
            parents,
          } = updatedData;
    
          const newLine = `${id},${firstname},${middlename},${lastname},${birthDate},${gender},${parents},${weddingDate},${spouses},${deathDate}\n`;
        
          updatedLines.push(newLine);
          updated = true;
        } else {
          updatedLines.push(lines[i]);
        }
      }
      
      if (updated) {
        fs.writeFileSync(filePath, updatedLines.join('\n') + '\n', 'utf8');
        console.log(`Line with id=${updatedData.id} updated.`);
        resolve(updatedData)
      } else {
        console.log(`No data found with id=${updatedData.id} in CSV.`);
        reject(new Error(`No data found with id=${updatedData.id}.`));
      }
    });
    
  } catch (error) {
    console.error(`Error updating  data: ${error}`);
    throw error;
  }
}
