process.env.NODE_ENV = 'test';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const server = require('../server');

const environment = process.env.NODE_ENV || 'development';
const configuration = require('../knexfile')[environment];
const database = require('knex')(configuration);

let adminToken;
let regToken;

chai.use(chaiHttp);

//trying to figure out how to set JWT in the before
const setJWTs = () => {
  chai.request(server)
  .post('/api/v1/authentication')
  .send({ email: 'sam@turing.io', appName: 'byob' })
  .end((error, response) => adminToken = JSON.parse(response.text))


  chai.request(server)
  .post('/api/v1/authentication')
  .send({ email: 'sam@ricknmorty.com', appName: 'byob' })
  .end((error, response) => regToken = JSON.parse(response.text))
}

describe('Client Routes', () => {
  it('should return some text from our default page', (done) => {
    chai.request(server)
    .get('/')
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.html;
      response.res.text.should.include('BYOB - School Finder')
      done();
    });
  });

  it('should return a 404 for a route that does not exist', (done) => {
    chai.request(server)
    .get('/rickandmorty')
    .end((error, response) => {
      response.should.have.status(404);
      done();
    });
  });
});

describe('API Routes', () => {

  before((done) => {
    setJWTs()
    database.migrate.latest()
    .then(() => done())
    .catch((error) => {
      console.log('error1', error);
    });
  });

  beforeEach((done) => {
    database.seed.run()
    .then(() => done())
    .catch((error) => {
      console.log('error2', error);
    });
  });

  it('should return all the counties!', (done) => {
    chai.request(server)
    .get('/api/v1/counties')
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.should.be.a('object');
      response.body.length.should.equal(2);
      done();
    });
  });

  it('should return all the districts!', (done) => {
    chai.request(server)
    .get('/api/v1/districts')
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.should.be.a('object');
      response.body.length.should.equal(4);
      done();
    });
  });

  it('should return all the schools!', (done) => {
    chai.request(server)
    .get('/api/v1/schools')
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.should.be.a('object');
      response.body.length.should.equal(2);
      done();
    });
  });

  it('should be able to return a county by the id', (done)=> {
    chai.request(server)
    .get('/api/v1/counties/1')
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.should.be.a('object');
      response.body.length.should.equal(1);
      response.body[0].should.have.property('id');
      response.body[0].id.should.equal(1);
      response.body[0].should.have.property('name');
      response.body[0].name.should.equal('ADAMS');
      response.body[0].should.have.property('county_code');
      response.body[0].county_code.should.equal('1');
      done();
    });
  });

  it('should be able to return a district by the id', (done)=> {
    chai.request(server)
    .get('/api/v1/districts/3')
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.should.be.a('object');
      response.body.length.should.equal(1);
      response.body[0].should.have.property('id');
      response.body[0].id.should.equal(3);
      response.body[0].should.have.property('name');
      response.body[0].name.should.equal('ALAMOSA RE-11J');
      response.body[0].should.have.property('district_code');
      response.body[0].district_code.should.equal('100');
      response.body[0].should.have.property('county_id');
      response.body[0].county_id.should.equal(2);
      done();
    });
  });

  it('should be able to return a school by the id', (done)=> {
    chai.request(server)
    .get('/api/v1/schools/2')
    .end((error, response) => {
      response.should.have.status(200);
      response.should.be.json;
      response.should.be.a('object');
      response.body.length.should.equal(1);
      response.body[0].should.have.property('id');
      response.body[0].id.should.equal(2);
      response.body[0].should.have.property('name');
      response.body[0].name.should.equal('ALAMOSA HIGH SCHOOL');
      response.body[0].should.have.property('school_code');
      response.body[0].school_code.should.equal('118');
      response.body[0].should.have.property('student_count');
      response.body[0].student_count.should.equal(598);
      response.body[0].should.have.property('teacher_count');
      response.body[0].teacher_count.should.equal(33.02);
      response.body[0].should.have.property('student_teacher_ratio');
      response.body[0].student_teacher_ratio.should.equal(18.11);
      response.body[0].should.have.property('district_id');
      response.body[0].district_id.should.equal(3);
      done();
    });
  });

  it('should return a 404 for a school id that does not exist', (done) => {
    chai.request(server)
    .get('/ap1/v1/schools/4590001')
    .end((error, response) => {
      response.should.have.status(404);
      done();
    });
  });

  it('should return a 404 for a district id that does not exist', (done) => {
    chai.request(server)
    .get('/ap1/v1/districts/4598978971')
    .end((error, response) => {
      response.should.have.status(404);
      done();
    });
  });

  it('should return a 404 for a counties id that does not exist', (done) => {
    chai.request(server)
    .get('/ap1/v1/counties/8937410892374')
    .end((error, response) => {
      response.should.have.status(404);
      done();
    });
  });

  describe('Authentication and Authorization tests', () => {
    it('should authenticate with a JWT', (done) => {
      chai.request(server)
      .post('/api/v1/authentication')
      .send({
        email: 'sam@turing.io',
        appName: 'byob'
      })
      .end((error, response) => {
        response.should.have.status(201);
        response.body.should.be.a('string');
        // response.body.should.equal(adminToken);

        done();
      });
    });

  });

  //post
  describe('POST to the API', () => {

    it('should be able to add a district', (done) => {
      chai.request(server)
      .post('/api/v1/districts')
      .set('Authorization', adminToken)
      .send({
        name: 'Denver',
        district_code: '0034',
        county_id: '1'
      })
      .end((error, response) => {
        response.should.have.status(201);
        response.body.should.have.property('id');
        done();
      });
    });

    it('should be able to add a school', (done) => {
      chai.request(server)
      .post('/api/v1/schools')
      .set('Authorization', adminToken)
      .send({
        name: 'School for the Dans',
        school_code: '1234',
        student_count: '2',
        teacher_count: '1',
        student_teacher_ratio: '.5',
        district_id: '1'
      })
      .end((error, response) => {
        response.should.have.status(201);
        response.body.should.have.property('id');
        done();
      });
    });

  });
  //put

  //patch




});
