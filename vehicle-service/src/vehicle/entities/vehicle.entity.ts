import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Directive, Field, ObjectType } from '@nestjs/graphql'


@ObjectType() // It converts normal TypeScript class ---> GraphQLType
@Directive('@key(fields: "vin")')
@Entity()
export class Vehicle {

    @Field()
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    firstName: string;

    @Field()
    @Column()
    lastName: string;

    @Field()
    @Column()
    email: string;

    @Field()
    @Column()
    carMake: string;

    @Field()
    @Column()
    carModel: string;

    @Field()
    @Column()
    vin: string;

    @Field()
    @Column()
    manufacturedDate: Date;

    @Field()
    @Column()
    ageOfVehicle: number

}