import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  createPerson,
  fetchPeople,
  fetchPerson,
  updatePerson,
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
  const personToCreate: Person = req.body;

  if (!personToCreate.firstname || !personToCreate.lastname) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 'message': 'First and last names are required.' });
  }


  const person = await createPerson(personToCreate);
  if (person) {
    return res.status(StatusCodes.CREATED).json({success: "Person created successfully", person});
  } else {
    return res.status(StatusCodes.BAD_REQUEST).json({message : `Could not create person at this time`});
  }
};

export const updatePersonDetails = async (req: Request, res: Response) => {
  const { personId } = req.params;
  const personToUpdate: Person = req.body;

  if (!personId) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 'message': 'Person ID is required.' });
  }

  const updatedPerson = await updatePerson({ ...personToUpdate, id: personId });
  if (updatedPerson) {
    return res.status(StatusCodes.OK).json({success: "Person updated successfully", person: updatedPerson});
  } else {
    return res.status(StatusCodes.NOT_FOUND).json({message : `Could not find any person with id ${personId}`});
  }
};