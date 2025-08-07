import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  createPerson,
  fetchPeople,
  fetchPerson,
} from "../services/csv/personService";
import { Person } from "../Interfaces/PersonInterface";


export const getPerson = async (req: Request, res: Response) => {
  const { personId } = req.params;
  const person = await fetchPerson(personId);

  if (person) {
    return res.status(StatusCodes.OK).json({message: "person fetched successfully", person}); 
  }

  return res.status(StatusCodes.NOT_FOUND).json({message : `Could not find any person with id ${personId}`});
};

export const getPeople= async (req: Request, res: Response) => {
  const people = await fetchPeople();
  if (people) {
    return res.status(StatusCodes.OK).json({message: "people fetched successfully", people}); 
  }

  return res.status(StatusCodes.NOT_FOUND).json({message : `Could not find any person(s) at this time`});
};

export const insertPerson = async (req: Request, res: Response) => {
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
  }  = req.body;

  if (!firstname || !lastname) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 'message': 'First and last names are required.' });
  }

  const personToCreate: Person = {
    firstname,
    middlename,
    lastname,
    gender,
    birthDate,
    weddingDate,
    deathDate,
    spouses,
    parents,
  };

  const person = await createPerson(personToCreate);
  if (person) {
    return res.status(StatusCodes.CREATED).json({success: "Person created successfully", person});
  } else {
    return res.status(StatusCodes.BAD_REQUEST).json({message : `Could not create person at this time`});
  }
};
