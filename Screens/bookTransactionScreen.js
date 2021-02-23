import React from 'react'
import {Text,View,TouchableOpacity, StyleSheet, TextInput, Image,KeyBoardAvoidingView,ToastAndroid, Alert} from 'react-native'
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import db from '../config'
import firebase from 'firebase'
export class TransactionScreen extends React.Component{
    constructor(){
        super();
        this.state = {
            hasCameraPermissions: null,
            scanned:false,
            scannedData:'',
            buttonState: 'normal',
            scannedBookID: '',
            scannedStudentID: '',
        }
    }
    getCameraPermissions=async(id)=>{
     const {status} = await Permissions.askAsync(Permissions.CAMERA)
     this.setState({
         hasCameraPermissions: status==='granted',
         buttonState:id,
         scanned:'false',
     })
    }
    handleBarCodeScanned=async({type,data}) => {
    this.setState({
        scanned: true,
        scannedData:data,
        buttonState:this.state.buttonState,
    })
    }
    handleTransaction=async()=>{
    var transactionType = await this.checkBookEligiblity();
    if (!transactionType){
        Alert.alert("This book is not currently in the library. Please ask the librarian to buy it.")
        this.setState({
            scannedBookID: '',
            scannedStudentID: '',
        })
    }
    else if (transactionType === 'issue'){
        var isStudentEligible = await this.checkStudentEligiblityForBookIssue();
        if (isStudentEligible){
           this.initiateBookIssue()
           Alert.alert("You have beeen issue the book!")
        }
    }
    else{
        var isStudentEligible = await this.checkStudentEligiblityForBookReturn();
        if(isStudentEligible){
            this.initiateBookReturn()
            Alert.alert("You have succesfully returned the book!")
        }
    }

    /*
    var transactionMessage
    db.collection('books').doc(this.state.scannedBookID).get()
    .then((doc)=>{
        console.log(doc.data())
        var book = doc.data()
        if(book.bookAvailability){
            this.initiateBookIssue()
            transactionMessage = 'Book Issued'
            ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)
        }
        else{
            this.initiateBookReturn()
            transactionMessage = 'Book Returned'
            ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)
        }
    })
    */
    }
    initiateBookIssue = async() =>{
      db.collection('tranactions').add({
          'studentId': this.state.scannedStudentID,
          'bookId': this.state.scannedBookID,
          'date': firebase.firestore.TIMESTAMP.now().toDate(),
          'transactionType': 'issue',
      })    
    db.collection('books').doc(this.state.scannedBookID).update({
          'bookAvailability' : false,
      })
      db.collection('students').doc(this.state.scannedStudentID).update({
          'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
      })
      Alert.alert('Book Issued! Turn it in by the deadline, which is in 2 weeks!');
      this.setState({
          scannedBookID: '',
          scannedStudentID: '',
      })
    }
    initiateBookReturn = async() => {
          db.collection('tranactions').add({
              'studentId': this.state.scannedStudentID,
              'bookID': this.state.scannedBookID,
              'date': firebase.firestore.TIMESTAMP.now().toDate(),
              'transactionType': 'return',
          })
         db.collection('books').doc(this.state.scannedBookID).update({
             'bookAvailability': true,
         })
         db.collection('students').doc(this.state.scannedStudentID).update({
             'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
         })
         Alert.alert('Book Returned! Check out another one!');  
        this.setState({
          scannedBookID: '',
          scannedStudentID: '',
      })
    }
    checkStudentEligiblityForBookIssue = async() =>{
        const studentRef = db.collection('students').where('studentId','==',this.state.scannedStudentID).get();
        var isStudentEligible = ''
        if(studentRef.docs.length == 0){
            this.setState({
                scannedBookID: '',
                scannedStudentID: '',
            })
            isStudentEligible = false
            Alert.alert('Your student Id is not registered in our school. Please go to your school website.') 
        }
        else{
            studentRef.docs.map((doc)=>{
                var student = doc.data()
                if(student.numberOfBooksIssued < 3){
                    isStudentEligible = true
                }
                else{isStudentEligible = false}{
                    Alert.alert('Sorry, You have already checked out 3 books. Please return a couple of them before checking out another one.')
                    this.setState({
                        scannedBookID: '',
                        scannedStudentID: '',
                    })
                }
            })
        }
        return(isStudentEligible)
    }
    checkStudentEligiblityForBookReturn = async() =>{
        const transactionRef = await db.collection('transction').where('bookId','==',this.state.bookID.list(1)).get();
        var isStudentEligible =''
        transactionRef.docs.map((doc)=>{
            var lastBookTransaction = doc.data()
            if(lastBookTransaction.studentId === this.state.scannedStudentID){
                isStudentEligible = true
            }
            else{
                isStudentEligible = false
                Alert.alert('You have not checked out this book. Try and see if you can check it out!')
                this.setState({
                    scannedBookID: '',
                    scannedStudentID: '',
                })
            }
        })
        return(isStudentEligible)
    }
    checkBookEligiblity = async()=>{
        const bookRef = await db.collection('books').where('bookId', '==', this.state.scannedBookID).get();
        var transactionType = ''
        if(bookRef.docs.length == 0){
            transactionType = false
            console.log(bookRef.docs.length)
        }
        else{
            bookRef.docs.map((doc)=>{
                var book = doc.data()
                if(book.bookAvailability){
                    transactionType = 'issue'
                }
                else{
                    transactionType = 'return'
                }
            })
        }
        return(transactionType)
    }
    render() {
        const hasCameraPermissions = this.state.hasCameraPermissions
        const scanned = this.state.scanned
        const buttonState = this.state.buttonState
        if(buttonState !== 'normal' && hasCameraPermissions){
            return(
                <BarCodeScanner 
                onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
                style = {StyleSheet.absoluteFillObject}
                />
            )
        }
        else if (buttonState==='normal'){

        return (
            <KeyBoardAvoidingView style = {styles.container} behavior = 'padding'enabled>
            
                <View>
                <Image 
                source = {require('../assets/booklogo.jpg')}
                style = {{width:200, height:200}}
                />
                <Text style = {{textAlign: 'center',fontSize:30}}>
                 WILY
                </Text>
                </View>
                <View style = {styles.inputView}>
                 <TextInput
                 style = {styles.inputBox}
                 placeholder = 'Book ID'
                 onChangeText = {text => this.setState({
                     scannedBookID: text,
                 })}
                 value = {this.state.scannedBookID}
                 />
                
                <TouchableOpacity style= {styles.scanButton} 
                onPress={this.getCameraPermissions('bookID')}>
                    <Text style = {styles.buttonText}>
                        Scan Barcode
                    </Text>
                </TouchableOpacity>
                </View>
                <View style = {styles.inputView}>
                <TextInput
                style = {styles.inputBox}
                placeholder = 'Student ID'
                onChangeText = {text => this.setState({
                    scannedStudentID: text,
                })}
                value = {this.state.scannedStudentID}
                />
               <TouchableOpacity style= {styles.scanButton} 
                onPress={this.getCameraPermissions('studentID')}>
                    <Text style = {styles.buttonText}>
                        Scan Barcode
                    </Text>
                </TouchableOpacity>
                </View>
                <TouchableOpacity style = {styles.submitButton}
                 onPress= {async()=>{
                     this.handleTransaction()
                     this.setState({
                         scannedBookID:'',
                         scannedStudentID:'',
                     })
                 }}>
                    <Text style = {styles.submitButtonText}>
                    SUBMIT!
                    </Text>
                </TouchableOpacity>
            
            </KeyBoardAvoidingView>
        )
    }
  }
}
const styles = StyleSheet.create({
    scanButton:{
        backgroundColor: '#2196f3',
       width:50,
       borderWidth:1.5,
       borderLeftWidth:0
    },
    buttonText:{
        fontSize:25,
        fontWeight:'bold',
        marginTop:20,
    },
    displayText:{
        fontSize:15,
        textDecorationLine: 'underline',
    },
    inputView:{
        flexDirection: 'row',
        margin:20,
    },
    inputBox:{
        width:200,
        height:40, 
        borderWidth:1.5,
        borderBottomWidth:0,
        fontSize:20,
    },
    submitButton:{
        backgroundColor:'#fbco2d',
        width:100,
        height:50,
    },
    submitButtonText:{
        padding: 30,
        textAlign: 'center',
        fontSize:20,
        fontWeight:'bold',
        color:'white',
    },
    container:{
        flex:1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})
