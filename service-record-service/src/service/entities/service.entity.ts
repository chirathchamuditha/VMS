import { Field, ID,Float, ObjectType, Directive } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn, Index } from "typeorm";

@ObjectType()
@Directive('@key(fields: "id")')
@Entity()
export class Service {

    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    @Index()
    vin: string;

    @Field()
    @Column({ name: 'service_type' })
    serviceType: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    description: string;

    @Field(() => Float)
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    cost: number;

    @Field()
    @Column({ name: 'service_date', type: 'date' })
    serviceDate: Date;

    @Field()
    @Column({ name: 'service_provider' })
    serviceProvider: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    technician: string;

    @Field({ nullable: true })
    @Column({ name: 'next_service_date', type: 'date', nullable: true })
    nextServiceDate: Date;
}