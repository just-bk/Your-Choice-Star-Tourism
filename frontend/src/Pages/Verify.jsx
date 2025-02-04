import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const Verify = () => {
  const {navigate, token, setCartItems, setCartItemsChild, backendUrl} = useContext(ShopContext)
  const [searchParams] = useSearchParams()

  const success = searchParams.get('success')
  const orderId = searchParams.get('orderId')

  // Store URL parameters in localStorage when component mounts
  useEffect(() => {
    if (success && orderId) {
      localStorage.setItem('pendingVerification', JSON.stringify({ success, orderId }))
    }
  }, [])

  const verifyPayment = async () => {
    try {
      // Get verification data from localStorage
      const pendingVerification = localStorage.getItem('pendingVerification')
      const verificationData = pendingVerification ? JSON.parse(pendingVerification) : null
      
      // Use either URL parameters or stored data
      const verifySuccess = success || (verificationData?.success)
      const verifyOrderId = orderId || (verificationData?.orderId)

      if (!token) {
        // If no token, redirect to login but don't show error
        // The verification will continue after login
        navigate('/login')
        return
      }

      if (!verifyOrderId) {
        toast.error('Order ID is missing')
        navigate('/')
        return
      }

      const response = await axios.post(
        `${backendUrl}/api/order/verifystripe`,
        { 
          success: verifySuccess, 
          orderId: verifyOrderId 
        },
        { headers: { token } }
      )

      // Clear stored verification data
      localStorage.removeItem('pendingVerification')

      if (response.data.success) {
        toast.success('Payment successful!')
        setCartItems({})
        setCartItemsChild({})
        navigate('/orders')
      } else {
        toast.error(response.data.message || 'Payment verification failed')
        navigate('/')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error(error.response?.data?.message || 'An error occurred')
      navigate('/')
    }
  }

  useEffect(() => {
    if (token) {
      verifyPayment()
    }
  }, [token])

  return (
    <div>
      verify
    </div>
  )
}

export default Verify
